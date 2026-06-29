import {
  world,
  system,
  Player,
  BlockPermutation,
  CommandPermissionLevel,
  CustomCommandParamType
} from '@minecraft/server';
//import { ActionFormData } from '@minecraft/server-ui'

import MultiDimension from './dimension.js';
import Command from "./commands.js";


/*
ADD MORE DIMENSION HERE
*/
const DIMENSIONS = [
  MultiDimension.addDimension('arena'),
  MultiDimension.addDimension('shop'),
  MultiDimension.addDimension('event_area')
]


world.afterEvents.worldLoad.subscribe(() => {
  for (const DMS of DIMENSIONS){
    ensurePlatformBuild(DMS)
  }
})


async function ensurePlatformBuild(dms){
  const dimension = world.getDimension(dms.dimensionId);
  const tickingId = dms.dimensionId;
  await world.tickingAreaManager.createTickingArea(tickingId, {
    dimension: dimension,
    from: {
      x: dms.spawnpoint.x - 10,
      y: dms.spawnpoint.y - 2,
      z: dms.spawnpoint.z - 10
    },
    to: {
      x: dms.spawnpoint.x + 10,
      y: dms.spawnpoint.y + 4,
      z: dms.spawnpoint.z + 10
    }
  })
  buildFloor(dimension, dms.spawnpoint);
  world.tickingAreaManager.removeTickingArea(tickingId);
}

function buildFloor(dimension, spawn){
  const floor = BlockPermutation.resolve("minecraft:grass_block");
  for (let x = -8; x <= 8; x++) {
    for (let z = -8; z <= 8; z++) {
      dimension.getBlock({ x: spawn.x + x, y: spawn.y-1, z: spawn.z + z })?.setPermutation(floor);
    }
  }
}


async function teleportToDimension(player, dimensionId){
  const dms = DIMENSIONS.find(j => j.dimensionId === `${j.namespace}:${dimensionId}`);
  const dimension = world.getDimension(dms.dimensionId);
  const tickingId = `${dimensionId}_teleport`;
  await world.tickingAreaManager.createTickingArea(tickingId, {
    dimension: dimension,
    from: {
      x: dms.spawnpoint.x - 8,
      y: dms.spawnpoint.y - 2,
      z: dms.spawnpoint.z - 8
    },
    to: {
      x: dms.spawnpoint.x + 8,
      y: dms.spawnpoint.y + 4,
      z: dms.spawnpoint.z + 8
    }
  })
  player.teleport(dms.spawnpoint, { dimension });
  world.tickingAreaManager.removeTickingArea(tickingId);
}

// Add enums
Command.addEnum("choose:dimensions", MultiDimension.ids.map(Id => Id.split(':')[1]));

// Add commands
Command.add({
  name: "dim:dimension",
  description: "See all available custom dimensions",
  permissionLevel: CommandPermissionLevel.Any,
  cheatsRequired: false
}, (origin) => {
  const player = origin.sourceEntity;
  if (!(player instanceof Player)) return;
  let message = "§7List name of all available custom dimension\n";
  for (let i=0;i<MultiDimension.ids.length;i++){
    message += `§7${i+1}. §6${MultiDimension.ids[i].split(':')[1]}\n`;
  }
  message += "§7==================================\n";
  message += "§7Type §r/tpdimension <dimensionName> §7to teleport";
  player.sendMessage(message)
})

Command.add({
  name: "dim:tpdimension",
  description: "Teleport to the custom dimension",
  permissionLevel: CommandPermissionLevel.Any,
  cheatsRequired: false,
  mandatoryParameters: [
    { name: "choose:dimensions", type: CustomCommandParamType.Enum }
  ]
}, (origin, dimensionId) => {
  const player = origin.sourceEntity;
  if (!(player instanceof Player)) return;
  teleportToDimension(player, dimensionId)
})


system.beforeEvents.startup.subscribe(event => {
  
  // register all dimension
  MultiDimension.registerAll(event);
  
  // register all commands
  Command.registerEnums(event);
  Command.registerCommands(event);
  
})