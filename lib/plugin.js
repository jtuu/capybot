module.exports = class Plugin{
  constructor(
    name = "default_plugin",
    trigger = "!default",
    payload = () => console.warn(`Unimplemented payload in plugin "${this.name}"`)
  ){
    try{
      this.type = trigger.constructor.name || typeof trigger;
    }catch(err){
      throw new TypeError("Malformed trigger");
    }

    this.name = name;
    this.trigger = trigger;
    this.payload = payload;
  }
}
