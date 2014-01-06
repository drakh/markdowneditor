var MarkdownEditor = new Class({
	Implements: Options,
	initialize: function (el, range)
	{
		this.parser = new MarkdownParser();//initialise parser
		this.el = new Element('div', {'class': 'editor'}).inject(el);//create editor element
		this.el.blur();
		this.range = range;
		this.keyboard = new Keyboard(
			{
				events:
				{
					'keydown:enter':this.insertLine.bind(this),
					'keydown:backspace':this.doBackspace.bind(this),
					'keydown:delete':this.doDelete.bind(this)
				}
			}
		).activate();
		this.lines = [];
		this.lines[0] = this.createLine(0).inject(this.el);
		this.el.addEvent('keyup', this.afterKey.bind(this));
		this.lines[0].focus();
		this.focused(0);
	},
	createLine: function (i)
	{
		var el = new Element('p').addClass('line_container').setProperties({'contenteditable': true,'spellcheck':false}).addEvents({
			'blur': this.blurred.pass(i, this),
			'focus': this.focused.pass(i, this),
			'mousedown':this.focused.pass(i,this)
		});
		return el;
	},
	blurred: function (i)
	{
	},
	focused: function (i)
	{
		console.log('focus:'+i);
		this.current_line = i;
	},
	afterKey: function (e)
	{
		switch (e.key)
		{
			case 'left':
			case 'right':
			case 'up':
			case 'down':
			case 'backspace':
			case 'enter':
				//we do not need to parse here
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
	doDelete:function(e)
	{
		var tmp=[];
		var lines = this.lines;
		var cl = this.current_line;
		var current_line = lines[cl];
		var txt = current_line.get('text');
		var pos = this.getCaretPos(current_line);
		if(pos==txt.length && cl<lines.length-1)
		{
			e.stop();
		}
	},
	doBackspace: function (e)
	{
		var tmp=[];
		var lines = this.lines;
		var cl = this.current_line;
		var current_line = lines[cl];
		var txt = current_line.get('text');
		var pos = this.getCaretPos(current_line);
		if(pos==0 && cl>0)
		{
			e.stop();
			for(var i=0;i<lines.length;i++)
			{
				console.log(i+'|'+cl);
				var l_txt=lines[i].get('text');
				if(i<cl-1)
				{
					console.log('smaller: '+i);
					tmp[i]=this.createLine(i).set('text',l_txt);
				}
				else if(i==cl-1)
				{
					pos=l_txt.length;
					console.log('one before: '+i);
					tmp[i]=this.createLine(i).set('text',l_txt+txt);
				}
				else if(i>cl)
				{
					console.log('after: '+i+'|'+(i-1));
					tmp[i-1]=this.createLine(i-1).set('text',l_txt);
				}
			}
			this.doLines(tmp);
			tmp[cl-1].focus();
			this.focused(cl-1);
			this.gotoPos(tmp[cl-1],pos);
			this.lines=tmp;
			this.parseLines();
		}
	},
	insertLine: function (e)
	{
		e.stop();
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
		for (var i = cl + 1; i < lines.length; i++)
		{
			var l_txt = lines[i].get('text');
			tmp[i + 1] = this.createLine(i).set('text', l_txt);
		}
		this.doLines(tmp);
		tmp[s + 1].focus();
		this.focused(s+1);
		this.gotoPos(tmp[s + 1], 0);
		this.lines = tmp;
		this.current_line = s + 1;
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
		this.reformatSpans();
	},
	reformatSpans:function()
	{
		var els=this.el.getElements('span.format');
		for(var i=0;i<els.length;i++)
		{
			var el=els[i];
			var sz=el.getSize();
			el.setStyles({
				'margin-left':(-1*(sz.x))
			});
		}
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