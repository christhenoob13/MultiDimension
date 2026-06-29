export default class MultiDimension{
  static ids = [];
  
  constructor(dimensionId, spawnpoint = { x: 0, y: 64, z: 100 }){
    this.namespace = 'dim';
    this.dimensionId = this.namespace + ':' + dimensionId;
    if (MultiDimension.ids.includes(this.dimensionId)) throw new Error("DimensionID already exist.");
    
    this.spawnpoint = spawnpoint;
    // this.label = dimensionId
    // this.settings = {  }
    
    MultiDimension.ids.push(this.dimensionId);
  }
  
  static addDimension(id){
    return new MultiDimension(id);
  }
  
  static registerAll(event){
    for (const dimensionId of Object.keys(MultiDimension.ids)){
      event.dimensionRegistry.registerCustomDimension(dimensionId);
    }
  }
}