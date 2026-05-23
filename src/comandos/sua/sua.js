import moment from "moment";
import Pedido from "../../database/models/Pedido.js";
import Sugerencia from "../../database/models/Sugerencia.js";
import Config from "../../database/models/Config.js";
import Group from "../../database/models/Group.js";
import User from "../../database/models/User.js";
import { header, category, cmdLine, aviso, listSection, listItem, infoHeader, infoField } from "../../utils/format.js";

const isAdmin = async (ctx) => {
  if (!ctx.from.endsWith("@g.us")) return false;
  const groupMetadata = await ctx.sock.groupMetadata(ctx.from);
  const participants = groupMetadata.participants;
  const user = participants.find(p => p.id === ctx.sender);
  return user && (user.admin === "admin" || user.admin === "superadmin");
};

const getUserId = async (text, ctx) => {
  if (ctx.mentionedJids.length > 0) {
    return ctx.mentionedJids[0];
  }
  if (text && text.includes("@s.whatsapp.net")) {
    return text.trim();
  }
  if (text) {
    const user = await User.findOne({ personaje: new RegExp(`^${text.trim()}$`, "i") });
    if (user) return user.jid;
  }
  return null;
};

export default [
  {
    name: "personajes",
    description: "Lista de personajes ocupados",
    category: "rp",
    cooldown: 3000,
    run: async (ctx, bot) => {
      const users = await User.find({ personaje: { $ne: null } }).sort({ fandom: 1 });
      if (users.length === 0) {
        return ctx.reply(aviso("No hay personajes asignados."));
      }

      let text = header("Lista de Personajes") + "\n";
      const grouped = {};
      users.forEach(u => {
        if (!grouped[u.fandom]) grouped[u.fandom] = [];
        grouped[u.fandom].push(u);
      });

      for (const fandom in grouped) {
        text += listSection(fandom.toUpperCase());
        grouped[fandom].forEach(u => {
          text += listItem(`${u.personaje} - @${u.jid.split("@")[0]}`);
        });
        text += "\n";
      }
      ctx.reply(text, users.map(u => u.jid));
    }
  },
  {
    name: "perfil",
    description: "Ver tu perfil o el de otro",
    category: "rp",
    cooldown: 3000,
    run: async (ctx, bot) => {
      const targetId = ctx.args.length > 0 ? await getUserId(ctx.args[0], ctx) : ctx.sender;
      const u = await User.findOne({ jid: targetId, communityId: ctx.communityId });
      if (!u) {
        return ctx.reply(aviso("Usuario no encontrado."));
      }

      const config = await Config.findOne({ _id: "global" }) || await Config.create({ _id: "global" });
      const diff = moment().diff(moment(u.lastSeen), "days");
      let status = "Activo";
      if (u.excusa?.activa) status = "Con Excusa";
      else if (diff >= config.minInactividad) status = "Inactivo";

      let text = header("Perfil de Usuario") + "\n";
      text += infoHeader();
      text += infoField("Personaje", u.personaje || "Ninguno");
      text += infoField("Fandom", u.fandom || "Ninguno");
      text += infoField("Mensajes", u.mensajes);
      text += infoField("Estado", status);
      text += infoField("Advertencias", `${u.advertencias.length}/${config.maxAdvertencias}`);
      text += infoField("Última vez", moment(u.lastSeen).fromNow());

      text += "\n\n" + aviso("Información actualizada.");
      ctx.reply(text, [targetId]);
    }
  },
  {
    name: "sinpersonaje",
    description: "Ver quiénes no tienen personaje",
    category: "rp",
    cooldown: 3000,
    run: async (ctx, bot) => {
      const users = await User.find({ personaje: null, communityId: ctx.communityId });
      if (users.length === 0) {
        return ctx.reply(aviso("Todos tienen personaje."));
      }

      let text = header("Sin Personaje") + "\n";
      text += listSection("USUARIOS");
      users.forEach(u => {
        text += listItem(`@${u.jid.split("@")[0]}`);
      });
      ctx.reply(text, users.map(u => u.jid));
    }
  },
  {
    name: "pedir",
    description: "Solicitar un personaje",
    category: "rp",
    cooldown: 3000,
    run: async (ctx, bot) => {
      if (ctx.args.length < 1) {
        return ctx.reply(aviso("Uso: !pedir Personaje (Fandom)"));
      }
      let fullText = ctx.args.join(" ");
      let personaje = fullText;
      let fandom = "General";

      const fandomMatch = fullText.match(/\(([^)]+)\)/);
      if (fandomMatch) {
        fandom = fandomMatch[1];
        personaje = fullText.replace(fandomMatch[0], "").trim();
      }

      await Pedido.create({ user: ctx.sender, personaje, fandom });
      ctx.reply(aviso(`Tu pedido para *${personaje}* (${fandom}) ha sido registrado.`));
    }
  },
  {
    name: "pedidos",
    description: "Ver lista de pedidos",
    category: "rp",
    cooldown: 3000,
    run: async (ctx, bot) => {
      const pedidos = await Pedido.find().sort({ fandom: 1 });
      if (pedidos.length === 0) {
        return ctx.reply(aviso("No hay pedidos pendientes."));
      }

      let text = header("Lista de Pedidos") + "\n";
      const grouped = {};
      pedidos.forEach(p => {
        if (!grouped[p.fandom]) grouped[p.fandom] = [];
        grouped[p.fandom].push(p);
      });

      for (const fandom in grouped) {
        text += listSection(fandom);
        grouped[fandom].forEach(p => {
          text += listItem(p.personaje);
        });
        text += "\n";
      }
      ctx.reply(text);
    }
  },
  {
    name: "top",
    description: "Top mensajes del grupo",
    category: "actividad",
    cooldown: 3000,
    run: async (ctx, bot) => {
      const limit = parseInt(ctx.args[0]) || 10;
      const top = await User.find({ communityId: ctx.communityId }).sort({ mensajes: -1 }).limit(limit);
      let text = header(`Top ${limit} Mensajes`) + "\n";
      text += listSection("RANKING");
      top.forEach(u => {
        text += listItem(`@${u.jid.split("@")[0]} - ${u.mensajes} mjs`);
      });
      ctx.reply(text, top.map(u => u.jid));
    }
  },
  {
    name: "low",
    description: "Usuarios con menos mensajes",
    category: "actividad",
    cooldown: 3000,
    run: async (ctx, bot) => {
      const low = await User.find({ communityId: ctx.communityId }).sort({ mensajes: 1 }).limit(10);
      let text = header("Low 10 Mensajes") + "\n";
      text += listSection("RANKING");
      low.forEach(u => {
        text += listItem(`@${u.jid.split("@")[0]} - ${u.mensajes} mjs`);
      });
      ctx.reply(text, low.map(u => u.jid));
    }
  },
  {
    name: "inactivos",
    description: "Ver usuarios inactivos",
    category: "actividad",
    cooldown: 3000,
    run: async (ctx, bot) => {
      const config = await Config.findOne({ _id: "global" }) || await Config.create({ _id: "global" });
      const days = parseInt(ctx.args[0]) || config.minInactividad;
      const threshold = moment().subtract(days, "days").toDate();
      const inactivos = await User.find({
        communityId: ctx.communityId,
        lastSeen: { $lt: threshold },
        personaje: { $ne: null }
      });

      if (inactivos.length === 0) {
        return ctx.reply(aviso(`No hay inactivos de ${days} días.`));
      }

      let text = header(`Inactivos (${days}+ días)`) + "\n";
      text += listSection("USUARIOS");
      inactivos.forEach(u => {
        const d = moment().diff(moment(u.lastSeen), "days");
        text += listItem(`@${u.jid.split("@")[0]} - ${u.personaje}`) + `       𝄄   _hace ${d} dias sin hablar_\n\n`;
      });
      ctx.reply(text, inactivos.map(u => u.jid));
    }
  },
  {
    name: "suge",
    description: "Enviar una sugerencia",
    category: "sugerencias",
    cooldown: 3000,
    aliases: ["sugerencia"],
    run: async (ctx, bot) => {
      if (ctx.args.length === 0) {
        return ctx.reply(aviso("Uso: !suge [tu sugerencia]"));
      }
      const dbUser = await User.findOne({ jid: ctx.sender, communityId: ctx.communityId });
      await Sugerencia.create({
        user: ctx.sender,
        personaje: dbUser?.personaje || "Sin personaje",
        contenido: ctx.args.join(" ")
      });
      ctx.reply(aviso("Sugerencia enviada correctamente."));
    }
  },
  {
    name: "sugerencias",
    description: "Ver sugerencias",
    category: "sugerencias",
    cooldown: 3000,
    run: async (ctx, bot) => {
      const suges = await Sugerencia.find();
      if (suges.length === 0) {
        return ctx.reply(aviso("No hay sugerencias."));
      }
      let text = header("Sugerencias") + "\n";
      text += listSection("BUZÓN");
      suges.forEach((s, i) => {
        text += listItem(`@${s.user.split("@")[0]} - ${s.personaje}`) + `       𝄄   _${s.contenido}_\n\n`;
      });
      ctx.reply(text, suges.map(s => s.user));
    }
  },
  {
    name: "excusas",
    description: "Ver lista de excusas activas",
    category: "sugerencias",
    cooldown: 3000,
    run: async (ctx, bot) => {
      const users = await User.find({ "excusa.activa": true, communityId: ctx.communityId });
      if (users.length === 0) {
        return ctx.reply(aviso("No hay excusas activas."));
      }

      let text = header("Lista de Excusas") + "\n";
      text += listSection("ACTUALES");
      users.forEach(u => {
        const diasRestantes = moment(u.excusa.fin).diff(moment(), "days");
        text += listItem(`@${u.jid.split("@")[0]} - ${u.personaje} (${diasRestantes}d)`) + `       𝄄   _- ${u.excusa.razon}_\n\n`;
      });
      ctx.reply(text, users.map(u => u.jid));
    }
  },
  {
    name: "asignar",
    description: "Asignar personaje a alguien",
    category: "admin",
    onlyAdmin: true,
    cooldown: 3000,
    run: async (ctx, bot) => {
      if (!(await isAdmin(ctx))) {
        return ctx.reply(aviso("Solo admins pueden usar este comando."));
      }
      if (ctx.args.length < 2) {
        return ctx.reply(aviso("Uso: !asignar @user Personaje (Fandom)"));
      }

      const targetId = await getUserId(ctx.args[0], ctx);
      if (!targetId) {
        return ctx.reply(aviso("No se encontró al usuario."));
      }

      let fullText = ctx.args.slice(1).join(" ");
      let personaje = fullText;
      let fandom = "General";

      const fandomMatch = fullText.match(/\(([^)]+)\)/);
      if (fandomMatch) {
        fandom = fandomMatch[1];
        personaje = fullText.replace(fandomMatch[0], "").trim();
      }

      const existing = await User.findOne({
        personaje: new RegExp(`^${personaje}$`, "i"),
        fandom: new RegExp(`^${fandom}$`, "i"),
        communityId: ctx.communityId
      });
      if (existing) {
        return ctx.reply(aviso(`El personaje *${personaje}* (${fandom}) ya está ocupado por @${existing.jid.split("@")[0]}.`, [existing.jid]));
      }

      let targetUser = await User.findOne({ jid: targetId, communityId: ctx.communityId });
      if (!targetUser) {
        targetUser = new User({ jid: targetId, communityId: ctx.communityId });
      }

      targetUser.personaje = personaje;
      targetUser.fandom = fandom;
      await targetUser.save();

      ctx.reply(aviso(`Personaje *${personaje}* (${fandom}) asignado a @${targetId.split("@")[0]}.`, [targetId]));
    }
  },
  {
    name: "adv",
    description: "Dar advertencia a un usuario",
    category: "admin",
    onlyAdmin: true,
    cooldown: 3000,
    run: async (ctx, bot) => {
      if (!(await isAdmin(ctx))) {
        return ctx.reply(aviso("Solo admins."));
      }
      if (ctx.args.length < 2) {
        return ctx.reply(aviso("Uso: !adv @user/personaje [razon]"));
      }

      const targetId = await getUserId(ctx.args[0], ctx);
      if (!targetId) {
        return ctx.reply(aviso("No se encontró al usuario."));
      }

      const razon = ctx.args.slice(1).join(" ");
      const u = await User.findOne({ jid: targetId, communityId: ctx.communityId });
      u.advertencias.push({ razon, admin: ctx.sender });
      await u.save();

      const config = await Config.findOne({ _id: "global" }) || await Config.create({ _id: "global" });
      ctx.reply(aviso(`Advertencia añadida a @${targetId.split("@")[0]} (${u.advertencias.length}/${config.maxAdvertencias})\nMotivo: ${razon}`, [targetId]));

      if (u.advertencias.length >= config.maxAdvertencias) {
        ctx.reply(aviso(`🚨 @${targetId.split("@")[0]} ha alcanzado el máximo de advertencias.`, [targetId]));
      }
    }
  },
  {
    name: "advertencias",
    description: "Ver lista de advertencias",
    category: "admin",
    onlyAdmin: true,
    cooldown: 3000,
    run: async (ctx, bot) => {
      const users = await User.find({ "advertencias.0": { $exists: true }, communityId: ctx.communityId }).sort({ fandom: 1 });
      if (users.length === 0) {
        return ctx.reply(aviso("No hay advertencias."));
      }

      let text = header("Lista de Advertencias") + "\n";
      const grouped = {};
      users.forEach(u => {
        if (!grouped[u.fandom || "Sin Fandom"]) grouped[u.fandom || "Sin Fandom"] = [];
        grouped[u.fandom || "Sin Fandom"].push(u);
      });

      for (const fandom in grouped) {
        text += listSection(fandom.toUpperCase());
        grouped[fandom].forEach(u => {
          text += listItem(`@${u.jid.split("@")[0]} - ${u.personaje} : ${u.advertencias.length}/${(async () => { const c = await Config.findOne({ _id: "global" }) || await Config.create({ _id: "global" }); return c.maxAdvertencias; })()}`);
          u.advertencias.forEach(adv => {
            text += `       𝄄   _- ${adv.razon}_\n`;
          });
          text += "\n";
        });
      }
      ctx.reply(text, users.map(u => u.jid));
    }
  },
  {
    name: "antispam",
    description: "Configurar sistema anti-spam",
    category: "admin",
    onlyAdmin: true,
    cooldown: 3000,
    run: async (ctx, bot) => {
      if (!(await isAdmin(ctx))) {
        return ctx.reply(aviso("Solo admins."));
      }
      const config = await Config.findOne({ _id: "global" }) || await Config.create({ _id: "global" });
      if (ctx.args[0] === "on" || ctx.args[0] === "off") {
        config.antispam.enabled = ctx.args[0] === "on";
        await config.save();
        return ctx.reply(aviso(`Sistema anti-spam: ${config.antispam.enabled ? "ENCENDIDO" : "APAGADO"}`));
      }
      if (ctx.args.length >= 2) {
        config.antispam.limit = parseInt(ctx.args[0]);
        config.antispam.seconds = parseInt(ctx.args[1]);
        await config.save();
        return ctx.reply(aviso(`Configurado: ${config.antispam.limit} mjs en ${config.antispam.seconds} seg.`));
      }
      ctx.reply(aviso("Uso: !antispam on/off O !antispam [mjs] [seg]"));
    }
  },
  {
    name: "excusa",
    description: "Poner excusa a un miembro",
    category: "admin",
    onlyAdmin: true,
    cooldown: 3000,
    run: async (ctx, bot) => {
      if (!(await isAdmin(ctx))) {
        return ctx.reply(aviso("Solo admins."));
      }
      if (ctx.args.length < 2) {
        return ctx.reply(aviso("Uso: !excusa @user/personaje [razon] [dias]"));
      }

      const targetId = await getUserId(ctx.args[0], ctx);
      if (!targetId) {
        return ctx.reply(aviso("No se encontró al usuario."));
      }

      let dias = 7;
      let razonArgs = ctx.args.slice(1);
      if (!isNaN(razonArgs[razonArgs.length - 1])) {
        dias = parseInt(razonArgs.pop());
      }
      const razon = razonArgs.join(" ");

      const u = await User.findOne({ jid: targetId, communityId: ctx.communityId });
      u.excusa = {
        fin: moment().add(dias, "days").toDate(),
        razon,
        activa: true
      };
      await u.save();

      ctx.reply(aviso(`Excusa puesta a @${targetId.split("@")[0]} por ${dias} días.\nMotivo: ${razon}`, [targetId]));
    }
  },
  {
    name: "quitar",
    description: "Quitar elemento por su #ID",
    category: "admin",
    onlyAdmin: true,
    cooldown: 3000,
    run: async (ctx, bot) => {
      if (!(await isAdmin(ctx))) {
        return ctx.reply(aviso("Solo admins."));
      }
      if (!ctx.args[0]?.startsWith("#")) {
        return ctx.reply(aviso("Uso: !quitar #numero"));
      }
      const num = parseInt(ctx.args[0].slice(1)) - 1;

      const pedidos = await Pedido.find();
      if (num < pedidos.length) {
        await Pedido.findByIdAndDelete(pedidos[num]._id);
        return ctx.reply(aviso(`Pedido #${num + 1} eliminado.`));
      }

      let currentOffset = pedidos.length;

      const suges = await Sugerencia.find();
      if (num < currentOffset + suges.length) {
        const sIdx = num - currentOffset;
        await Sugerencia.findByIdAndDelete(suges[sIdx]._id);
        return ctx.reply(aviso(`Sugerencia #${num + 1} eliminada.`));
      }

      currentOffset += suges.length;

      const excusas = await User.find({ "excusa.activa": true, communityId: ctx.communityId });
      if (num < currentOffset + excusas.length) {
        const eIdx = num - currentOffset;
        const u = excusas[eIdx];
        u.excusa.activa = false;
        await u.save();
        return ctx.reply(aviso(`Excusa #${num + 1} (de ${u.personaje}) eliminada.`));
      }

      currentOffset += excusas.length;

      const usersWithAdv = await User.find({ "advertencias.0": { $exists: true }, communityId: ctx.communityId }).sort({ fandom: 1 });
      if (num < currentOffset + usersWithAdv.length) {
        const uIdx = num - currentOffset;
        const u = usersWithAdv[uIdx];
        u.advertencias.pop();
        await u.save();
        return ctx.reply(aviso(`Advertencia de @${u.jid.split("@")[0]} eliminada.`, [u.jid]));
      }

      ctx.reply(aviso("No se encontró el elemento con ese número."));
    }
  }
];