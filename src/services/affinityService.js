import Affinity from "../database/models/Affinity.js"; 
 
class AffinityService { 
  static async add(jid, communityId, value) { 
    await Affinity.updateOne( 
      { jid, communityId }, 
      { $inc: { affinity: value } }, 
      { upsert: true } 
    ); 
  } 
} 
 
export default AffinityService; 
