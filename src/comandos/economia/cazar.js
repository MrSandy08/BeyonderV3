import EconomyService from "../../services/economyService.js"; 
 
export const name = "cazar"; 
export const aliases = ["hunt"]; 
 
export const run = async (ctx) => { 
  const result = await EconomyService.hunt(ctx.sender, ctx.from); 
  await ctx.reply(result.message); 
}; 
