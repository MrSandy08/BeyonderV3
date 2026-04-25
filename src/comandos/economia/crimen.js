import CrimeService from "../../services/crimeService.js"; 
 
export const name = "crimen"; 
 
export const run = async (ctx) => { 
  const res = await CrimeService.commit(ctx.sender, ctx.from); 
 
  if (!res.ok) return ctx.reply(res.error); 
  return ctx.reply(res.message); 
}; 
