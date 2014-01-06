var MarkdownEditor = new Class({
	Implements: Options,
	initialize: function (el, range)
	{
		this.parser = new MarkdownParser();//initialise parser
		this.el = new Element('div', {'class': 'editor'}).inject(el);//create editor element
		this.el.blur();
		this.range = range;
		this.lines = [];
		this.lines[0] = this.createLine(0).inject(this.el);
		this.el.addEvent('keydown', this.prepareKey.bind(this));
		this.el.addEvent('keyup', this.afterKey.bind(this));
		this.lines[0].focus();
	},
	createLine: function (i)
	{
		var el = new Element('p').addClass('line_container').setProperty('contenteditable', true).addEvents({
			'blur': this.blurred.pass(i, this),
			'focus': this.focused.pass(i, this)
		});
		return el;
	},
	blurred: function (i)
	{
	},
	focused: function (i)
	{
		console.log('focused:' + i);
		this.current_line = i;
	},
	prepareKey: function (e)
	{
		switch (e.key)
		{
			case 'enter':
				//case 'backspace':
				e.stop();
				break;
		}
		switch (e.key)
		{
			case 'enter':
				this.insertLine();
				break;
		}
	},
	afterKey: function (e)
	{
		switch (e.key)
		{
			case 'left':
			case 'right':
			case 'enter':
				break;
			default :
				this.parseLines();
				break;
		}
	},
	getPreCaretStr: function (el)
	{
		var range = this.range.getSelection().getRangeAt(0);
		var preCaretRange = range.cloneRange();
		preCaretRange.selectNodeContents(el);
		preCaretRange.setEnd(range.endContainer, range.endOffset);
		var str = preCaretRange.toString();
		return str;
	},
	insertLine: function ()
	{
		var lines = this.lines;
		var cl = this.current_line;
		var current_line = lines[cl];
		var txt = current_line.get('text');
		var txts = ['', ''];
		var pos = this.getCaretPos(current_line);
		txts[0] = txt.substr(0, pos);
		txts[1] = txt.substr(pos, txt.length);
		var tmp = [];

		for (var i = 0; i < cl; i++)
		{
			var l_txt = lines[i].get('text');
			tmp[i] = this.createLine(i).set('text', l_txt);
		}
		var s = tmp.length;
		tmp[s] = this.createLine(s).set('text', txts[0]);
		tmp[s + 1] = this.createLine(s).set('text', txts[1]);
		for(var i=cl+1;i<lines.length;i++)
		{
			var l_txt = lines[i].get('text');
			tmp[i+1] = this.createLine(i).set('text', l_txt);
		}
		console.log(tmp);
		this.doLines(tmp);
		console.log(s + 1);
		tmp[s + 1].focus();
		this.gotoPos(tmp[s + 1], 0);
		this.lines = tmp;
		this.current_line=s+1;
		this.parseLines();
	},
	getCaretPos: function (el)
	{
		var str = this.getPreCaretStr(el);
		return str.length;
	},
	gotoPos: function (el, pos)
	{
		this.range.getSelection().selectCharacters(el, pos, pos);
	},
	parseLines: function ()
	{
		var w = this.el;
		var lines = this.lines;
		var current_line = this.current_line;
		var els = [];
		var pos = this.getCaretPos(lines[current_line]);
		for (var i = 0; i < lines.length; i++)
		{
			var line = lines[i];
			var text = line.get('text')
			var parsed_line = this.parser.line(text);
			var el = this.createLine(i).addClass(parsed_line.class).set('html', parsed_line.value);
			els[i] = el;
		}
		this.doLines(els);
		els[current_line].focus();
		this.gotoPos(els[current_line], pos);
		this.lines = els;
	},
	doLines: function (lines)
	{
		var w = this.el;
		w.empty();
		for (var i = 0; i < lines.length; i++)
		{
			lines[i].inject(w);
		}
	}
});