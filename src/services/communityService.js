import CommunityState from "../database/models/CommunityState.js"; 
 
class CommunityService { 
  static async registerActivity(communityId) { 
    await CommunityState.updateOne( 
      { communityId }, 
      { $set: { lastActivity: new Date() } }, 
      { upsert: true } 
    ); 
  } 
} 
 
export default CommunityService; 
