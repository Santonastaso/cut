import{s as o}from"./index-de16f643.js";class d{static async saveResult(t){const{data:s,error:a}=await o.from("optimization_results").insert([{algorithm_type:t.algorithmType,algorithm_settings:t.settings,efficiency:t.statistics.efficiency,total_waste:t.statistics.totalWaste,rolls_used:t.statistics.rollsUsed,total_rolls:t.statistics.totalRolls,fulfilled_requests:t.statistics.fulfilledRequests,total_requests:t.statistics.totalRequests,cutting_plans:t.cuttingPlans}]).select().single();if(a)throw a;return s}static async savePatterns(t,s){const a=s.map(e=>({optimization_result_id:t,roll_id:e.roll.id,material_code:e.material,efficiency:e.efficiency,waste:e.waste,used_width:e.usedWidth,cuts:e.cuts})),{data:i,error:r}=await o.from("cutting_patterns").insert(a).select();if(r)throw r;return i}static async saveAllocations(t,s){const a=s.map(e=>({optimization_result_id:t,cutting_pattern_id:e.cuttingPatternId,request_id:e.requestId,allocated_width:e.allocatedWidth,allocated_length:e.allocatedLength})),{data:i,error:r}=await o.from("request_allocations").insert(a).select();if(r)throw r;return i}static async getResults(t=50){const{data:s,error:a}=await o.from("optimization_results").select(`
        *,
        cutting_patterns(
          *,
          stock_rolls(*)
        ),
        request_allocations(
          *,
          cut_requests(*)
        )
      `).order("created_at",{ascending:!1}).limit(t);if(a)throw a;return s}static async getResultById(t){const{data:s,error:a}=await o.from("optimization_results").select(`
        *,
        cutting_patterns(
          *,
          stock_rolls(*)
        ),
        request_allocations(
          *,
          cut_requests(*)
        )
      `).eq("id",t).single();if(a)throw a;return s}static async getResultsByAlgorithm(t,s=20){const{data:a,error:i}=await o.from("optimization_results").select(`
        *,
        cutting_patterns(
          *,
          stock_rolls(*)
        ),
        request_allocations(
          *,
          cut_requests(*)
        )
      `).eq("algorithm_type",t).order("created_at",{ascending:!1}).limit(s);if(i)throw i;return a}static async deleteResult(t){const{error:s}=await o.from("optimization_results").delete().eq("id",t);if(s)throw s}static async getOptimizationHistory(t=100){const{data:s,error:a}=await o.from("optimization_summary").select("*").order("created_at",{ascending:!1}).limit(t);if(a)throw a;return s}static async getAlgorithmComparison(){const{data:t,error:s}=await o.from("optimization_results").select("algorithm_type, efficiency, total_waste, rolls_used, fulfilled_requests").order("created_at",{ascending:!1}).limit(100);if(s)throw s;const a=t.reduce((r,e)=>(r[e.algorithm_type]||(r[e.algorithm_type]=[]),r[e.algorithm_type].push(e),r),{}),i={};return Object.entries(a).forEach(([r,e])=>{i[r]={efficiency:Math.max(...e.map(l=>parseFloat(l.efficiency))),waste:Math.min(...e.map(l=>parseFloat(l.total_waste))),rollsUsed:Math.min(...e.map(l=>l.rolls_used)),fulfilledRequests:Math.max(...e.map(l=>l.fulfilled_requests))}}),i}}export{d as OptimizationService};
