var PlatformTransformer = (function(){
	
	//interface
	//
	//ObjectToEnum(): string
	//FileExtension: string
	//ObjectToClass(): string
	//OnFilenameDefined(): string
	//
	
	function PlatformTransformer(owner, lang){
		this.Owner = owner;
		this.Language = lang;
	};
		
	PlatformTransformer.prototype.Transform = function(){
	
		var o = this.Owner;
		var files = [];
		var self = this;
		
		//Enums
		for(var enumName in o.Globals){
			files.push({
				filename: this.Language.OnFilenameDefined ? this.Language.OnFilenameDefined(enumName) : (enumName + this.Language.FileExtension),
				content: this.Language.ObjectToEnum(enumName, o.Globals[enumName])
			});
		}
		
		//Services
		for(var service in o.bungieNetPlatform){
			
			//Only look at properties which are a "service"
			if(service.toLowerCase().indexOf("service") < 0){
				continue;
			}
			
			files.push({
				filename: this.Language.OnFilenameDefined ? this.Language.OnFilenameDefined(service) : (service + this.Language.FileExtension),
				content: this.Language.ObjectToClass(service, o.bungieNetPlatform[service])
			});
			
		}
	
		return files;
		
	};
	
	return PlatformTransformer;

})();