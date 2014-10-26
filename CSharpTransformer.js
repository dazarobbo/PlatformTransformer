var CSharpTransformer = (function(){
	
	function CSharpTransformer(ns){
		
		this.DefaultNamespace = ns;
		this.FileExtension = ".cs";
		this.Usings = [];
		this.UseWcf = false;
		this.EnumFlags = false;
		
		this.OnNamespaceDefined = null;
		this.OnClassNameDefined = null;
		this.OnEnumNameDefined = null;
		this.OnEnumNameDefined = null;
		this.OnEnumValueDefined = null;
		this.OnFilenameDefined = null;
		this.OnConstructorDefined = null;
		this.OnMethodTypeDefined = null;
		this.OnMethodNameDefined = null;
		this.OnParametersDefined = null;
		this.OnMethodBodyDefined = null;
		this.OnPropertyTypeDefined = null;
		this.OnPropertyNameDefined = null;
		
	}
	
	CSharpTransformer.GetFunctionBody = function(f){
		//http://stackoverflow.com/a/3180012/570787
		var entire = f.toString();
		var body = entire.substring(entire.indexOf("{") + 1, entire.lastIndexOf("}"));
		return body;
	};
	
	CSharpTransformer.GetParameters = function(f){
	
		//http://stackoverflow.com/a/9924463/570787
		var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
		var ARGUMENT_NAMES = /([^\s,]+)/g;
		function getParamNames(func) {
		  var fnStr = func.toString().replace(STRIP_COMMENTS, '')
		  var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES)
		  if(result === null)
			 result = []
		  return result;
		}
		
		var params = getParamNames(f);
		var str = "";
		
		for(var i = 0, l = params.length; i < l; ++i){
		
			str += "object " + params[i];
			
			if(i < l - 1){
				str += ", ";
			}
		
		}
		
		return str;
	
	};
	
	CSharpTransformer.ObjectIsFlags = function(obj){
	
		var keys = Object.keys(obj);
		
		//Add up flag values
		var flags = keys.reduce(function(p, c){ return p += p ^ obj[c]; }, 0);
		
		//Check if the value is equal to all bits set for the number of members
		return flags === Math.pow(2, keys.length - 1);
	
	};
	
	CSharpTransformer.IsCSharpProperty = function(v){
		
		switch(typeof v){
			
			case "number":
			case "string":
			case "boolean":
			case "object":
				return true;
		
		}
		
		return false;
		
	};
	
	CSharpTransformer.IsCSharpMethod = function(v){
		return typeof v === "function";
	};
	
	CSharpTransformer.GetCSharpType = function(v){
	
		switch(typeof v){
		
			case "string": return "string";
			case "number": return "int";
			case "boolean": return "bool";
			case "object":
			default:
				return "object";
		
		}
	
	};
	
	CSharpTransformer.prototype.ObjectToEnum = function(enumName, obj){
	
		var keys = Object.keys(obj);
		var w = new Writer();
		
		//Output usings
		this.Usings.forEach(function(u){ w.AppendLine(u); });
		
		w.AppendLine();
		
		//Namespace
		w.Append("namespace ");
		w.Append(this.OnNamespaceDefined ? this.OnNamespaceDefined(enumName) : this.DefaultNamespace);
		w.AppendLine(" {");
		w.AppendLine();
		
			//WCF
			if(this.UseWcf){
				w.AppendTab().AppendLine("[DataContract]");
			}
			
			//Enum flags
			if(this.EnumFlags && CSharpTransformer.ObjectIsFlags(obj)){
				w.AppendTab().AppendLine("[Flags]");
			}
		
			//Class definition
			w.AppendTab().Append("public enum ");
			w.Append(this.OnEnumNameDefined ? this.OnEnumNameDefined(enumName) : enumName);
			w.Append(" {");
			w.AppendTab().AppendLine().AppendLine();
		
			//Members
			for(var i = 0, l = keys.length; i < l; ++i){
			
				if(this.UseWcf){
					w.AppendTab(2).AppendLine("[EnumMember]");
				}
				
				w.AppendTab(2);
				
				//Name defined
				w.Append(this.OnEnumNameDefined ? this.OnEnumNameDefined(keys[i]) : keys[i]);
				
				w.Append(" = ");
				
				//Value defined
				w.Append(this.OnEnumValueDefined ? this.OnEnumValueDefined(obj[keys[i]]) : obj[keys[i]]);
				
				//Add comma
				if(i < l - 1){
					w.Append(",");
				}
				
				w.AppendLine();
				w.AppendLine();
			
			}
	
			w.AppendTab().AppendLine("}");
			
		w.Append("}");
	
		return w.toString();
	
	};
	
	CSharpTransformer.prototype.ObjectToClass = function(className, obj){
	
		var keys = Object.keys(obj);
		var w = new Writer();
		
		//Output usings
		this.Usings.forEach(function(u){ w.AppendLine(u); });
		
		w.AppendLine();
		
		//Namespace
		w.Append("namespace ");
		w.Append(this.OnNamespaceDefined ? this.OnNamespaceDefined(className) : this.DefaultNamespace);
		w.AppendLine(" {");
		w.AppendLine();
		
			//WCF
			if(this.UseWcf){
				w.AppendTab().AppendLine("[DataContract]");
			}
			
			//Class definition
			w.AppendTab().Append("public class ");
			w.Append(this.OnClassNameDefined ? this.OnClassNameDefined(className) : className);
			w.Append(" {");
			w.AppendTab().AppendLine().AppendLine();
			
			//Members
			//Aim to have properties first then methods
			for(var i = 0, l = keys.length; i < l; ++i){
				
				w.AppendTab(2).Append("public ");
				
				//Is method?
				if(CSharpTransformer.IsCSharpMethod(obj[keys[i]])){
					
					//Is constructor?
					if(keys[i] === className){
						w.Append(this.OnConstructorDefined ? this.OnConstructorDefined(className) : className);
					}
					else{
						w.Append(this.OnMethodTypeDefined ? this.OnMethodTypeDefined(obj[keys[i]]) : CSharpTransformer.GetCSharpType(obj[keys[i]]));
						w.Append(" ");
						w.Append(this.OnMethodNameDefined ? this.OnMethodNameDefined(keys[i]) : keys[i]);
					}
					
					//Parameters
					w.Append("(");
					w.Append(this.OnParametersDefined ? this.OnParametersDefined(obj[keys[i]]) : CSharpTransformer.GetParameters(obj[keys[i]]));
					w.AppendLine(") {");
					
						if(this.OnMethodBodyDefined){
							w.AppendTab(3).AppendLine(this.OnMethodBodyDefined(obj[keys[i]]));
						}
						else{
						
							//Add in exception and JS function body in C# comment
							w.AppendTab(3).AppendLine("throw new NotImplementedException();").AppendLine();
							w.AppendTab(3).AppendLine("/*");
								w.AppendTab(4).AppendLine(CSharpTransformer.GetFunctionBody(obj[keys[i]].toString()));
							w.AppendTab(3).AppendLine("*/");
						
						}
					
					w.AppendTab(2).Append("}");
					
				}
				else if(CSharpTransformer.IsCSharpProperty(obj[keys[i]])){
					
					//Type
					w.Append(this.OnPropertyTypeDefined ? this.OnPropertyTypeDefined(obj[keys[i]]) : CSharpTransformer.GetCSharpType(obj[keys[i]]));
					
					w.Append(" ");
					
					//Name
					w.Append(this.OnPropertyNameDefined ? this.OnPropertyNameDefined(keys[i]) : keys[i]);
					
					w.Append(";");
					
				}
				
				w.AppendLine();
				w.AppendLine();
			
			}
			
			w.AppendTab().AppendLine("}");
			
		w.Append("}");
		
		return w.toString();
	
	};
	
	return CSharpTransformer;
	
})();