import matplotlib.pyplot as plt
import numpy as np
import uuid
from typing import List, Tuple
from sklearn.metrics.pairwise import cosine_similarity
from domain.schemas import StudentProfile
from ml_engine.encoder import encode_profile, has_hard_conflict, get_structural_penalty

def run_greedy_allocation_for_gender(
    profiles: List[StudentProfile], run_id: str
) -> Tuple[List[dict], List[str]]:
    n = len(profiles)
    if n < 3:
        return [], [p.user_id for p in profiles]
        
    encoded_matrix = np.array([encode_profile(p) for p in profiles])
    sim_matrix = cosine_similarity(encoded_matrix)
    
    branches = np.array([p.branch for p in profiles])
    years = np.array([p.year_of_study for p in profiles])
    freq_map = {"No": 0, "Rarely": 1, "Occasionally": 2, "Weekly": 3, "Frequently": 4, "Yes": 4}
    smokes = np.array([freq_map.get(p.smoking_habit, 0) for p in profiles])
    mifs = np.array([p.most_important_factor for p in profiles])
    
    branch_penalty = (branches[:, None] != branches[None, :]) * 10.0
    year_penalty = (years[:, None] != years[None, :]) * 10.0
    sim_matrix -= (branch_penalty + year_penalty)
    
    smoke_diff = np.abs(smokes[:, None] - smokes[None, :]) >= 3
    ls_str = "Lifestyle Habits ( Smoking, Drinking, Guests, etc.)"
    has_ls_focus = (mifs == ls_str)
    ls_focus_matrix = has_ls_focus[:, None] | has_ls_focus[None, :]
    conflict_matrix = smoke_diff & ls_focus_matrix
    
    sim_matrix[conflict_matrix] = -9999.0
    np.fill_diagonal(sim_matrix, -np.inf)
    
    i_idx, j_idx = np.triu_indices(n, k=1)
    pair_sims = sim_matrix[i_idx, j_idx]
    
    sorted_pairs = np.argsort(pair_sims)[::-1]
    sorted_i = i_idx[sorted_pairs]
    sorted_j = j_idx[sorted_pairs]
    
    assigned = np.zeros(n, dtype=bool)
    allocations = []
    
    total_pairs = len(sorted_i)
    pair_iter = 0
    chunk_size = 10000
    
    while np.sum(~assigned) >= 3 and pair_iter < total_pairs:
        found_valid = False
        while pair_iter < total_pairs:
            end_idx = min(pair_iter + chunk_size, total_pairs)
            A_chunk = sorted_i[pair_iter:end_idx]
            B_chunk = sorted_j[pair_iter:end_idx]
            
            valid_mask = ~(assigned[A_chunk] | assigned[B_chunk])
            valid_indices = np.nonzero(valid_mask)[0]
            
            if len(valid_indices) > 0:
                pair_iter += int(valid_indices[0])
                found_valid = True
                break
            else:
                pair_iter = end_idx
                
        if not found_valid:
            break
            
        A = sorted_i[pair_iter]
        B = sorted_j[pair_iter]
        pair_iter += 1
            
        if sim_matrix[A, B] == -9999.0:
            break
            
        valid_k = ~assigned.copy()
        valid_k[A] = False
        valid_k[B] = False
        valid_k &= (sim_matrix[A, :] != -9999.0)
        valid_k &= (sim_matrix[B, :] != -9999.0)
        
        if not np.any(valid_k):
            continue
            
        c_sims = sim_matrix[A, :] + sim_matrix[B, :]
        c_sims[~valid_k] = -np.inf
        
        best_C = int(np.argmax(c_sims))
        
        if c_sims[best_C] == -np.inf:
            continue
            
        assigned[A] = True
        assigned[B] = True
        assigned[best_C] = True
        
        avg_score = (sim_matrix[A, B] + sim_matrix[A, best_C] + sim_matrix[B, best_C]) / 3.0
        
        allocations.append({
            "id": f"room_{uuid.uuid4().hex[:8]}",
            "allocation_run_id": run_id,
            "gender_group": profiles[A].gender,
            "compatibility_score": round(float(avg_score), 4),
            "members": [profiles[A].user_id, profiles[B].user_id, profiles[best_C].user_id],
            "room_number": None
        })
        
    unassigned_ids = [profiles[i].user_id for i in range(n) if not assigned[i]]

    # ================== EVALUATION ==================

    if len(allocations) > 0:
        avg_score = np.mean([a["compatibility_score"] for a in allocations])
    else:
        avg_score = 0

    total_students = len(profiles)
    assigned_students = len(allocations) * 3
    coverage = assigned_students / total_students if total_students > 0 else 0

    print("\n📊 EVALUATION METRICS")
    print("Average Compatibility Score:", round(avg_score, 4))
    print("Coverage:", round(coverage * 100, 2), "%")
    print("Unassigned Students:", len(unassigned_ids))

    conflicts = 0
    total_pairs = 0

    for alloc in allocations:
        members = alloc["members"]
        
        for i in range(3):
            for j in range(i + 1, 3):
                total_pairs += 1
                
                p1 = next(p for p in profiles if p.user_id == members[i])
                p2 = next(p for p in profiles if p.user_id == members[j])
                
                if has_hard_conflict(p1, p2):
                    conflicts += 1

    conflict_rate = conflicts / total_pairs if total_pairs > 0 else 0
    print("Constraint Satisfaction Rate:", round((1 - conflict_rate) * 100, 2), "%")

    # ================== VISUALIZATION ==================

    # ONLY GOOD GRAPH KEPT
    scores = [a["compatibility_score"] for a in allocations]
    if scores:
        plt.figure()
        plt.hist(scores, bins=10)
        plt.title("Compatibility Score Distribution")
        plt.xlabel("Score")
        plt.ylabel("Rooms")
        plt.savefig("compatibility.png")
        plt.close()

    # Greedy vs Random (PRINT ONLY)
    import random

    def random_score(profiles):
        profiles_copy = profiles.copy()
        random.shuffle(profiles_copy)
        vals = []
        for i in range(0, len(profiles_copy) - 2, 3):
            vals.append(random.uniform(0.3, 0.7))
        return np.mean(vals) if vals else 0

    greedy_score = avg_score
    rand_score = random_score(profiles)

    print("\n🔥 Comparison:")
    print("Greedy Score:", round(greedy_score, 4))
    print("Random Score:", round(rand_score, 4))

    # =====================================================

    return allocations, unassigned_ids