//import Database from './database.js';
import { world, system, BlockPermutation } from '@minecraft/server';

export default class VoidDimension{
  static voids = {};
  
  constructor(voidID){
    this.voidID = voidID;
    
    if (this.voidID in VoidDimension.voids) throw new Error("VoidID already exist");
    
    VoidDimension.voids[this.voidID] = {
      owner: null,
      id: this.voidID,
      name: this.voidID,
      spawnpoint: { x: 0, y: 64, z: 0},
      publicVoid: false,
      allowlist: []
    }
  }
  
  /* Get player void name */
  static myVoids(player){
    const void_data = VoidDimension.get_voids_data();
    const player_voids = JSON.parse(player.getDynamicProperty(`void:ids`) ?? "[]");
    return Object.values(
      Object.fromEntries(
        Object.entries(void_data).filter(([key]) => player_voids.includes(key))
      )
    ).map(x => x.name);
  }
  
  /* Get voids data */
  static get_voids_data(){
    return JSON.parse(world.getDynamicProperty("void:data") ?? "{}")
  }
  
  /* Save voids data */
  static set_voids_data(newData){
    world.setDynamicProperty("void:data", JSON.stringify(newData))
  }
  
  /* own a void world */
  static ownVoid(player, voidName){
    
    const data = VoidDimension.get_voids_data();
    const unownedVoids = Object.values(data).filter(x => !x.owner);
    const ownedVoids = VoidDimension.myVoids(player);
    
    if (unownedVoids.length <= 0){
      return {
        success: false,
        message: "No available void dimension to own"
      }
    }
    if (voidName.includes(' ')){
      return {
        success: false,
        message: "void names must not contain any spaces"
      }
    }
    if (ownedVoids.includes(voidName)){
      return {
        success: false,
        message: "Void name already exist"
      }
    }
    
    // set new data
    data[unownedVoids[0].id] = { ...unownedVoids[0], owner: player.name, name: voidName };
    VoidDimension.set_voids_data(data);
    
    // build floor
    system.run(()=>{ensurePlatformBuild(data[unownedVoids[0].id])});
    
    const playerData = JSON.parse(player.getDynamicProperty("void:ids") ?? "[]");
    playerData.push(unownedVoids[0].id);
    player.setDynamicProperty("void:ids", JSON.stringify(playerData))
    
    return {
      success: true,
      message: "Successfully owned a void dimension"
    }
  }
  
  /* teleport to the void dimension */
  static async teleport(player, Void){
    const dimension = world.getDimension(Void.id);
    const tickingId = `${Void.id}_teleport`;
    
    await world.tickingAreaManager.createTickingArea(tickingId, {
      dimension: dimension,
      from: {
        x: Void.spawnpoint.x - 8,
        y: Void.spawnpoint.y - 2,
        z: Void.spawnpoint.z - 8
      },
      to: {
        x: Void.spawnpoint.x + 8,
        y: Void.spawnpoint.y + 4,
        z: Void.spawnpoint.z + 8
      }
    })
    player.teleport(Void.spawnpoint, { dimension });
    world.tickingAreaManager.removeTickingArea(tickingId);
  }
  
  /* Create unowned Void */
  static create(voidID){
    return new VoidDimension(voidID)
  }
  
  /* Register all voids */
  static registerAll(event){
    system.run(() => {
    const voidIds = Object.keys(VoidDimension.voids);
    world.setDynamicProperty("void:ids", JSON.stringify(voidIds))
    
    if (Object.keys(VoidDimension.get_voids_data()).length <= 0){
      VoidDimension.set_voids_data(VoidDimension.voids);
    }
    })
    for (const voidID of Object.keys(VoidDimension.voids)){
      event.dimensionRegistry.registerCustomDimension(voidID);
    }
  }
}


async function ensurePlatformBuild(Void){
  const dimension = world.getDimension(Void.id);
  const tickingId = Void.id;
  await world.tickingAreaManager.createTickingArea(tickingId, {
    dimension: dimension,
    from: {
      x: Void.spawnpoint.x - 10,
      y: Void.spawnpoint.y - 2,
      z: Void.spawnpoint.z - 10
    },
    to: {
      x: Void.spawnpoint.x + 10,
      y: Void.spawnpoint.y + 4,
      z: Void.spawnpoint.z + 10
    }
  })
  buildFloor(dimension, Void.spawnpoint);
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