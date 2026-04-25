import ExtortionService from "../../services/extortionService.js"; 
import { resolveTarget } from "../../services/userResolver.js"; 
 
export const name = "extorsionar"; 
 
export const run = async (ctx) => { 
  const target = resolveTarget(ctx); 
 
  const res = await ExtortionService.execute( 
    ctx.sender, 
    target, 
    ctx.from 
  ); 
 
  if (!res.ok) return ctx.reply(res.error); 
  return ctx.reply(res.message); 
}; 
