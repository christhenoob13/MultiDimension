import {
  system,
  Player,
  CommandPermissionLevel,
  CustomCommandParamType
} from '@minecraft/server';
//import { ActionFormData } from '@minecraft/server-ui'

import VoidDimension from './dimension.js';
import Command from "./commands.js";

const MAX_DIMENSIONS = 20; // Maximum void dimension
const namespace = "void"; // namespace for pack

/* Initialize voids */
for (let i=0;i<MAX_DIMENSIONS;i++){
  VoidDimension.create(`void:grieq${i+1}`);
}

Command.add({
  name: `${namespace}:createvoid`,
  description: "Create your own void dimension",
  permissionLevel: CommandPermissionLevel.Any,
  cheatsRequired: false,
  mandatoryParameters: [
    { name: "owner", type: CustomCommandParamType.PlayerSelector },
    { name: "voidName", type: CustomCommandParamType.String },
    { name: "secretPassword", type: CustomCommandParamType.String }
  ]
}, (origin, owner, voidName, password) => {
  const commander = origin.sourceEntity;
  
  if (!(commander instanceof Player)) return;
  if (owner.length > 1) return commander.sendMessage("§c[error] Please select only one player.");
  if (password !== "GR33G") return commander.sendMessage("§c[error] Invalid secret password");
  
  const { success, message } = VoidDimension.ownVoid(owner[0], voidName);
  commander.sendMessage(`${success ? '§a[success]':'§c[error]'} ${message}`);
})
Command.add({
  name: `${namespace}:voids`,
  description: "See all available void dimensions",
  permissionLevel: CommandPermissionLevel.Any,
  cheatsRequired: false
}, (origin) => {
  const player = origin.sourceEntity;
  if (!(player instanceof Player)) return;
  
  const myVoids = VoidDimension.myVoids(player)
  
  let message = "§7List name of all available void dimension\n";
  if (myVoids.length <= 0) {
    message += "§c- No available void dimension\n";
  }else{
    for (let i=0;i<myVoids.length;i++){
      message += `§7${i+1}. §6${myVoids[i]}\n`;
    }
  }
  message += "§7=============================\n";
  message += "§7Type §r/tpvoid <voidName> §7to teleport";
  player.sendMessage(message)
})
Command.add({
  name: `${namespace}:tpvoid`,
  description: "Teleport to the void dimension",
  permissionLevel: CommandPermissionLevel.Any,
  cheatsRequired: false,
  mandatoryParameters: [
    { name: `voidName`, type: CustomCommandParamType.String }
  ]
}, (origin, voidName) => {
  const player = origin.sourceEntity;
  if (!(player instanceof Player)) return;
  
  const data = VoidDimension.get_voids_data();
  const Void = Object.values(data).find(el => el.name === voidName);
    
  // if void not available or invalid void name
  if (!Void) return player.sendMessage("§c[error] Void name not found, enter §6/voids §cto see all your available void dimension")
  
  const isOwner = player.name === Void.owner;
  const isAllowed = Void.allowlist.includes(player.name);
  const isAdmin = player.getTags().includes("admin");
  
  if (!(isOwner || isAllowed || isAdmin)) {
    return player.sendMessage("§6[warning] You don't have permission to access this void");
  }
  
  system.run(()=>{VoidDimension.teleport(player, Void)});
})


system.beforeEvents.startup.subscribe(event => {
  
  // register all commands
  Command.registerEnums(event);
  Command.registerCommands(event);
  
  // register all dimension
  VoidDimension.registerAll(event);
})