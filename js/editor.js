var MarkdownEditor = new Class({
	Implements: Options,
	smartTypingPairs: {'"': '"', '(': ')', '{': '}', '[': ']', '<': '>', '`': '`', "'": "'"},
	initialize: function (el, range)
	{
		this.dohighlight = false;
		this.parser = new MarkdownParser();//initialise parser
		this.el = new Element('div', {'class': 'editor'}).setProperties({'contenteditable': true, 'spellcheck': false}).addEvents({
			'keydown': this.prepareKey.bind(this),
			'keyup': this.getPos.bind(this),
			'keypress': this.keyLog.bind(this)
		}).inject(el);//create editor element
		this.el.blur();
		this.range = range;
		this.blocks = [];
		this.blocks[0] = this.createBlock(0);
		this.doBlocks(this.blocks);
		this.blocks[0].focus();
		this.focused(0);
	},
	keyLog: function (e)
	{
		console.log('keypress:'+e.key);
		console.log(e);
		if (this.smartTypingPairs[e.key])
		{
			e.stop();
			var current_block = this.blocks[this.current_block];
			var txt = current_block.get('text');
			var start_pos = this.getCaretPos(current_block);
			if (start_pos < txt.length)
			{
				this.range.getSelection().expand('word');
				var end_pos = this.getCaretPos(current_block);
				this.insertAtPos(current_block, start_pos, e.key);
				this.insertAtPos(current_block, end_pos + 1, this.smartTypingPairs[e.key]);
			}
			else
			{
				this.insertAtPos(current_block, start_pos, e.key + this.smartTypingPairs[e.key]);
			}
		}
		else
		{
			switch (e.key)
			{
				case 'left':
				case 'right':
				case 'top':
				case 'down':
				case 'backspace':
				case 'delete':
				case 'enter':
					break;
				default:
					this.parseBlocks();
					break;
			}
		}
	},
	getPos: function (e)
	{
		var pos = this.getCaretPos(this.el);
		console.log('keyuppos:' + pos);
		console.log(pos);
	},
	doHighlight: function (e)
	{
		e.stop();
		if (this.dohighlight === false)
		{
			this.el.addClass('dohighlight');
			this.dohighlight = true;
		}
		else
		{
			this.el.removeClass('dohighlight');
			this.dohighlight = false;
		}
	},
	createBlock: function (i)
	{
		var el = new Element('p').addClass('block_container');
		return el;
	},
	prepareKey: function (e)
	{
		console.log(e);
		var pos = this.getCaretPos(this.el);
		console.log('keydownpos:' + pos);
		if (e && e.key)
		{
			switch (e.key)
			{
				case 'enter':
					e.stop();
					this.insertBlock(e);
					break;
				case 'backspace':
					e.stop();
					this.doBackspace(e);
					break;
				case 'delete':
					e.stop();
					this.doDelete(e);
					break;
				case 'd':
					if (e.control)
					{
						e.stop();
						this.doHighlight(e);
					}
					break;
			}
		}
	},
	focused: function (i)
	{
		console.log('focus: ' + i);
		var blocks = this.blocks;
		for (var k = 0; k < blocks.length; k++)
		{
			blocks[k].removeClass('highlighted');
		}
		blocks[i].addClass('highlighted');
		this.current_block = i;
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
	doDelete: function (e)
	{
		var tmp = [];
		var blocks = this.blocks;
		var cl = this.current_block;
		var current_block = blocks[cl];
		var txt = current_block.get('text');
		var pos = this.getCaretPos(current_block);
		if (pos == txt.length && cl < blocks.length - 1)
		{
			e.stop();//prevent default action
			//iterate thru blocks
			for (var i = 0; i < blocks.length; i++)
			{
				var l_txt = blocks[i].get('text');
				if (i < cl)
				{
					//copy previous blocks
					tmp[i] = this.createBlock(i).set('text', l_txt);
				}
				else if (i == cl)
				{
					//merge current block with next block
					l_txt = blocks[i + 1].get('text');
					tmp[i] = this.createBlock(i).set('text', txt + l_txt);
				}
				else if (i > cl + 1)
				{
					//add remaining blocks
					tmp[i - 1] = this.createBlock(i - 1).set('text', l_txt);
				}
			}
			this.doBlocks(tmp);
			tmp[cl].focus();
			//this.focused(cl);
			this.gotoPos(tmp[cl], pos);
			this.parseBlocks();
		}
	},
	doBackspace: function (e)
	{
		console.log(e);
		e.stopPropagation();
		var tmp = [];
		//cache data
		var blocks = this.blocks;
		var cl = this.current_block;
		var current_block = blocks[cl];
		var txt = current_block.get('text');
		var pos = this.getCaretPos(current_block);
		//if we are on the begining of the block and block is not the first block do custom backspace action
		if (pos == 0 && cl > 0)
		{
			e.stop();//prevent default action of event
			//iterate thru blocks
			for (var i = 0; i < blocks.length; i++)
			{
				var l_txt = blocks[i].get('text');
				if (i < cl - 1)
				{
					//add blocks before current block
					tmp[i] = this.createBlock(i).set('text', l_txt);
				}
				else if (i == cl - 1)
				{
					//merge current block with previous block
					pos = l_txt.length;
					tmp[i] = this.createBlock(i).set('text', l_txt + txt);
				}
				else if (i > cl)
				{
					//ad remaining blocks
					tmp[i - 1] = this.createBlock(i - 1).set('text', l_txt);
				}
			}
			//reinsert blocks
			this.doBlocks(tmp);
			//focus on current block
			tmp[cl - 1].focus();
			//this.focused(cl - 1);
			//move carret to right position
			this.gotoPos(tmp[cl - 1], pos);
			//reparse content
			this.parseBlocks();
		}
	},
	insertBlock: function (e)
	{
		e.stop();//prevent default action of event
		//cache data
		var blocks = this.blocks;
		var cl = this.current_block;
		var current_block = blocks[cl];
		var txt = current_block.get('text');
		var txts = ['', ''];
		var pos = this.getCaretPos(current_block);
		txts[0] = txt.substr(0, pos);
		txts[1] = txt.substr(pos, txt.length);
		var tmp = [];
		for (var i = 0; i < blocks.length; i++)//iterate thru blocks
		{
			var l_txt = blocks[i].get('text');
			if (i < cl)
			{
				tmp[i] = this.createBlock(i).set('text', l_txt);
			}
			else if (i == cl)//split the current block or add new one
			{
			}
			else//add remaining blocks
			{
			}
		}
		var s = tmp.length;
		tmp[s] = this.createBlock(s).set('text', txts[0]);
		tmp[s + 1] = this.createBlock(s).set('text', txts[1]);
		for (var i = cl + 1; i < blocks.length; i++)
		{
			var l_txt = blocks[i].get('text');
			tmp[i + 1] = this.createBlock(i).set('text', l_txt);
		}
		this.doBlocks(tmp);
		tmp[s + 1].focus();
		this.focused(s + 1);
		this.gotoPos(tmp[s + 1], 0);
		this.parseBlocks();
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
	insertAtPos: function (el, pos, contents)
	{
		var range = this.range.createRange();
		range.selectCharacters(el, pos, pos);
		range.pasteHtml(contents);
		this.gotoPos(el, pos + contents.length);
	},
	parseBlocks: function ()
	{
		var blocks = this.blocks;
		var current_block = this.current_block;
		var els = [];
		var pos = this.getCaretPos(blocks[current_block]);
		for (var i = 0; i < blocks.length; i++)
		{
			var block = blocks[i];
			var text = block.get('text')
			var parsed_block = this.parser.block(text);
			var el = this.createBlock(i).addClass(parsed_block.class).set('html', parsed_block.value);
			els[i] = el;
		}
		this.doBlocks(els);
		els[current_block].focus();
		//this.focused(current_block);
		this.gotoPos(els[current_block], pos);
		this.reformatSpans();
	},
	reformatSpans: function ()
	{
		var els = this.el.getElements('span.format');
		for (var i = 0; i < els.length; i++)
		{
			var el = els[i];
			var sz = el.getSize();
			el.setStyles({
				'margin-left': (-1 * (sz.x))
			});
		}
	},
	doBlocks: function (blocks)
	{
		var w = this.el;
		w.empty();
		for (var i = 0; i < blocks.length; i++)
		{
			blocks[i].inject(w);
		}
		this.blocks = blocks;
	}
});