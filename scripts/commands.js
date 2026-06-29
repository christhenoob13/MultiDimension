export default class Command{
  static enums = [];
  static commands = [];
  
  constructor() {
    throw new Error("This is a static utility class and cannot be instantiated.");
  }
  
  static add(options, callback){
    Command.commands.push({ options, callback })
  }
  
  static addEnum(enumId, data){
    Command.enums.push({ id: enumId, list: data })
  }
  
  static registerEnums(event){
    for (const Enum of Command.enums){
      event.customCommandRegistry.registerEnum(
        Enum.id,
        Enum.list
      )
    }
  }
  
  static registerCommands(event){
    for (const cmd of Command.commands){
      event.customCommandRegistry.registerCommand(
        cmd.options,
        cmd.callback
      )
    }
  }
}