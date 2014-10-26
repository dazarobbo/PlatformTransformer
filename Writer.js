var Writer = (function(){

	function Writer(s){
		this._Str = s ? s : "";
	}
	
	Writer.Newline = "\r\n";
	Writer.Tab = "\t";
	
	Writer.prototype.Append = function(s){
		this._Str += s;
		return this;
	};
	
	Writer.prototype.AppendLine = function(s){
		if(typeof s !== "undefined") this._Str += s;
		this._Str += Writer.Newline;
		return this;
	};

	Writer.prototype.AppendTab = function(n){
		n = n || 1;
		for(var i = 0; i < n; ++i) this._Str += Writer.Tab;
		return this;
	};
	
	Writer.prototype.toString = function(){
		return this._Str;
	};
	
	return Writer;

})();