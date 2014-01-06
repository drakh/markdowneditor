var MarkdownParser = new Class({
	Implements: Options,
	/* Block */
	tab: /^(\t+)(.*)/,
	header: /^(#{1,}\s)(.*)/,
	blockquote: /^((>\s)+)(.*)/,
	list: /^([*+-]\s|\d+\.\s)(.*)/,
	/* Inline */
	strong: /^(__)(?=\S)([^\0]*?\S)(__)(?!_)|^(\*\*)(?=\S)([^\0]*?\S)(\*\*)(?!\*)/,
	em: /^(_)(?=\S)([^\0]*?\S)(_)(?!_)|^(\*)(?=\S)([^\0]*?\S)(\*)(?!\*)/,
	del: /^(-)(?=\S)([^\0]*?\S)(-)(?!-)/,
	text: /^[^\0]+?(?=[_*-]|$)/,
	initialize: function ()
	{
		this.pre = new Element('pre');
	},
	escape: function (str)
	{
		var pre = this.pre;
		pre.set('text', str);
		return pre.get('html');
	},
	line: function (text)
	{
		var match, value;
		var line = {value: '', class: ''};
		var parsed = false;
		if (match = this.tab.exec(text))
		{
			parsed = true;
			line.class = 'code';
			value = '<span class="tab">' + match[1] + '</span>' + Parser.inline(match[2]);
		}
		if (match = this.header.exec(text))
		{
			parsed = true;
			var h_class = 'h' + (match[1].length-1);
			line.class = h_class;
			value = '<span class="' + h_class + '">' + match[1] + '</span>' + this.inline(match[2]);
		}
		if (match = this.blockquote.exec(text))
		{
			parsed = true;
			line.class = 'blockquote';
			value = '<span class="blockquote">' + match[1] + '</span>' + this.inline(match[3]);
		}
		if (match = this.list.exec(text))
		{
			parsed = true;
			line.class = 'list';
			var todo = match[1] == "+ " || match[1] == "- " ? '<span class="todo">' + match[1][0] + '</span> ' : match[1];
			if (match[1] == "+ ")
			{
				value = '<span>' + todo + '</span><del>' + this.inline(match[2]) + '</del>';
			}
			else
			{
				value = '<span>' + todo + '</span>' + this.inline(match[2]);
			}
		}
		if (parsed === false)
		{
			value = this.inline(text);
		}
		line.value = value;
		return line;
	},
	inline: function (text)
	{
		var match, line = [], value, tag;
		while (text)
		{
			if (match = this.strong.exec(text))
			{
				tag = match[1] || match[4];
				value = tag + '<strong>' + this.escape(match[2] || match[5]) + '</strong>' + tag;
				line.push(value);
				text = text.slice(match[0].length);
				continue;
			}
			if (match = this.em.exec(text))
			{
				tag = match[1] || match[4];
				value = tag + "<em>" + this.escape(match[2] || match[5]) + "</em>" + tag;
				line.push(value);
				text = text.slice(match[0].length);
				continue;
			}
			if (match = this.del.exec(text))
			{
				value = "-<del>" + this.escape(match[2]) + "</del>-";
				line.push(value);
				text = text.slice(match[0].length);
				continue;
			}
			if (match = this.text.exec(text))
			{
				line.push(this.escape(match[0]));
				text = text.slice(match[0].length);
				continue;
			}
		}
		return line.join("");
	}
});
