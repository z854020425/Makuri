// TODO: Keep-Alive
setInterval(()=>{console.info(1);}, 500);



class Utils{
	constructor(){}
	static pretty_date(date){
		if (!date) {return '####';}
		if (!date.includes('-')){
			return '▶ ' + date.substring(0, 4) + '-' + date.substring(4, 6) + '-' + date.substring(6, 8);
		}
		date = date.split('-');
		if (date[1].length == 1) {
			date[1] = '0' + date[1];
		}
		if (date[2].length == 1) {
			date[2] = '0' + date[2];
		}
		return '▶ ' + date.join('-');
	}
	static pretty_str(str, max_len=25){
		const reg = /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g;
		let cnt = 0;
		for (let i = 0; i < str.length; i += 1){
			cnt += reg.test(str[i]) ? 2 : 1
			if (cnt > max_len - 1){
				return str.substring(0, i) + '…'
			}
		}
		return str;
	}
	static sec2str(sec){
		if (!Number.isInteger(sec)) return;
		let str = '';
		if (sec > 3600){
			str += Math.floor(sec / 3600).toString().padStart(2, 0) + ':';
			sec = Math.floor(sec % 3600);	
		}
		str += Math.floor(sec / 60).toString().padStart(2, 0) + ':';
		sec = Math.floor(sec % 60);
		str += sec.toString().padStart(2, 0);
		return str;
	}
	static str2sec(str){
		if (typeof(str) != 'string') return;
		str = str.split(':');
		let sec = 0;
		for (let s of str){
			sec = sec * 60 + parseInt(s, 10);
		}
		return sec;
	}
	static add_styles(styles){
		if (Array.isArray(styles)){
			styles = styles.join('\n');
		}
		let tag = document.createElement('style');
		tag.innerText = styles;
		document.head.insertAdjacentElement('afterend', tag);
	}
	static create(tag_name, class_names=[], attrs={}){
		let ret = document.createElement(tag_name);
		class_names.forEach(name => {
			ret.classList.add(name);
		})
		Object.keys(attrs).forEach(key => {
			ret.setAttribute(key, attrs[key]);
		})
		return ret;
	}
	static get_cookie(name){
		let cookies = document.cookie.split(';');
		let ret = null;
		cookies.forEach(cookie => {
			cookie = cookie.split('=');
			if (cookie[0].trim() == name) {
				ret = cookie.length > 1 ? unescape(cookie[1].trim()) : null;
				return;
			}
		});
		return ret;
	}
	static set_cookie(key, value){
		let cookies = document.cookie.split(';');
		let cookies_dic = {};
		cookies.forEach(cookie => {
			cookie = cookie.split('=');
			if(cookie.length != 2){
				return;
			}
			cookies_dic[cookie[0].trim()] = cookie[1].trim();
		});
		cookies_dic[String(key)] = String(value);
		let cookies_str = '';
		Object.keys(cookies_dic).forEach(key => {
			cookies_str += key + '=' + cookies_dic[key] + ';';
		});
		document.cookie = cookies_str;
	}
}

const PLAY_FORESTAGE = Utils.get_cookie('play_forestage') == 'true' ? true : false;


class DataLoader{
	constructor(TAGS){
		this.songs = {};
		this.songs_info = JSON.parse(this.load_data('./songs_info.json'));
		this.TAGS = TAGS
		this.titles = [];
	}
	get length(){
		let cnt = 0;
		Object.keys(this.songs).forEach(title => {
			cnt += this.songs[title].length;
		});
		return cnt;
	}
	load_data(path){
		let request = new XMLHttpRequest();
		request.open('GET', path, false);
		request.send(null);
		return request.responseText;
	}
	json2songs_timer(data, video_author=null){
		console.time('json2songs_timer');
		let ret = this.json2songs(data, video_author);
		console.timeEnd('json2songs_timer');
		return ret
	}
	json2songs(data, video_author=null){
		data = JSON.parse(data);
		let title, _title, date, length, singer, lang, parts, tags, in_pt, out_pt, is_clip, href;
		Object.keys(data).forEach(bvid => {
			if (bvid[0] == '?') {return;}
			title = data[bvid]?.['title'];
			date = data[bvid]?.['date'];
			length = data[bvid]?.['length'];
			singer = data[bvid]?.['singer'] ?? '';
			lang = data[bvid]?.['lang'] ?? '';
			parts = data[bvid]?.['parts'];
			tags = data[bvid]?.['tags'] ?? [];
			in_pt = data[bvid]?.['in_pt'] ?? 1;
			out_pt = data[bvid]?.['output'] ?? null;
			is_clip = data[bvid]?.['is_clip'] ?? false;
			href = 'https://www.bilibili.com/video/' + bvid + '/?t=' + in_pt;
			if (!parts) {
				this.add_song({
					'title': title,
					'date': date,
					'href': href,
					'length': length,
					'singer': singer,
					'lang': lang,
					'tags': tags,
					'author': video_author,
					'is_clip': is_clip
				});
				return;
			}
			let part;
			Object.keys(parts).forEach(p => {
				part = parts[p]?.['part'];
				title = parts[p]?.['title'];
				date = parts[p]?.['date'] ?? date;
				length = parts[p]?.['length'];
				singer = parts[p]?.['singer'] ?? '';
				lang = parts[p]?.['lang'] ?? '';
				tags = parts[p]?.['tags'] ?? [];
				in_pt = parts[p]?.['in_pt'] ?? 1;
				out_pt = parts[p]?.['out_pt'] ?? null;
				is_clip = parts[p]?.['is_clip'] ?? false;
				href = 'https://www.bilibili.com/video/' + bvid + '/?t=' + in_pt + '&p=' + part;				
				this.add_song({
					'title': title,
					'date': date,
					'href': href,
					'length': length,
					'singer': singer,
					'lang': lang,
					'tags': tags,
					'author': video_author,
					'is_clip': is_clip
				});
				return;
			})
		});
	}
	csv2songs_timer(data, video_author=null){
		console.time('csv2songs_timer');
		let ret = this.csv2songs(data, video_author);
		console.timeEnd('csv2songs_timer');
		return ret
	}
	csv2songs(data, video_author=null){
		let bvid, date, page, in_pt, out_pt, title, tags, href, item;
		let lines = data.split('\r\n');
		for (let line of lines){
			item = line.split(',');
			if (item.every(x => x == '')){
				break;
			}
			bvid = item[0] === '' ? bvid : item[0].match(/BV[\da-zA-Z]{10}/)[0];
			date = item[1] === '' ? date : item[1];
			page = item[2] === '' ? page : item[2]
			in_pt = Utils.str2sec(item[3]);
			out_pt = Utils.str2sec(item[4]);
			title = item[5];
			tags = item[6];

			href = 'https://www.bilibili.com/video/' + bvid + '/?t=' + in_pt + '&p=' + page.substring(1);
			this.add_song({
				'title': title,
				'date': date,
				'href': href,
				'length': Utils.sec2str(out_pt - in_pt),
				'singer': '',
				'lang': '',
				'tags': tags === '' ? [] : tags.split(' '),
				'author': video_author,
				'is_clip': true
			})
		}
	}
	add_song(song){
		let title, date, href, length, singer, lang, tags, author, is_clip, item, chs;
		title = song?.title;
		date = song?.date;
		href = song?.href;
		length = song?.length;
		singer = song?.singer;
		lang = song?.lang;
		tags = song?.tags ?? [];
		author = song?.author;
		is_clip = song?.is_clip;
		if (!(title in this.songs)){
			this.songs[title] = [];
		}
		Object.keys(this.TAGS).forEach(TAG => {
			if (this.TAGS[TAG].includes(title)){
				tags.unshift(TAG);
			}
		});
		if ((this.songs_info?.[title]??[]).length == 1 && 'chs' in this.songs_info[title][0]){
			chs = this.songs_info[title][0]['chs'];
		} else {
			chs = '';
		}
		if ((!singer || !lang) && (title in this.songs_info)){
			if (this.songs_info[title].length == 1){
				singer = singer === '' ? this.songs_info[title][0].singer : singer;
				lang = lang === '' ? this.songs_info[title][0].lang : lang;
			} else {
				singer = 'TBD.';
				lang = 'TBD.';
			}
		}
		if (tags.includes('follow')){
			item = this.songs[title].pop();
			item['length'] = Utils.sec2str(Utils.str2sec(item['length']) + Utils.str2sec(length));
			item['tags'] = item['tags'].concat(tags.filter(x => x != 'follow'));
			item['tags'] = item['tags'].filter((tag, idx) => item['tags'].indexOf(tag) == idx);
			item['tag'] = item['tags'].join(' ').toLowerCase();
			this.songs[title].push(item);
			return;
		}
		this.songs[title].push({
			'title': title.toLowerCase() + '|' + chs.toLowerCase(),
			'date': Utils.pretty_date(date),
			'href': href,
			'length': length,
			'singer': singer,
			'lang': lang,
			'tags': tags,
			'tag': tags.join(' ').toLowerCase(),
			'author': author,
			'is_clip': is_clip,
			'chs': chs
		});
	}
	sort_songs(){
		this.titles = Object.keys(this.songs).sort((x1, x2) => x1.localeCompare(x2, 'zh-Hans-CN'));
	}
}


class NewWin{
	constructor(play_forestage=PLAY_FORESTAGE){
		this.new_win = null;
		this.timeout_close = null;
		this.play_forestage = play_forestage;
	}
	get isAvailable(){
		return this.new_win != null && !this.new_win.closed;
	}
	close(force=false){
		if ((force || this.play_forestage) && this.isAvailable){
			this.new_win.close();
			this.new_win = null;
		}
	}
	get open(){
		return this.play_forestage ? this.open_url : this.change_url;
	}
	change_url(url, duration=null, is_clip=false){
		if (!this.isAvailable){
			this.open_url(url, duration, is_clip);
			return;
		}
		if (this.timeout_close){
			clearTimeout(this.timeout_close);
			this.timeout_close = null;
		}
		this.new_win.location.href = url;
	}
	open_url(url, duration=null, is_clip=false){
		if (this.timeout_close) {
			clearTimeout(this.timeout_close);
			this.timeout_close = null;
		}
		this.close();
		this.new_win = window.open(url);
		if (is_clip && duration != null) {
			this.timeout_close = setTimeout(()=>{
				this.close();
			}, (str2sec(duration) + 0.5) * 1000);
		}
	}
	set_forestage(flag) {	
		this.play_forestage = flag;
		Utils.set_cookie('play_forestage', flag);
	}
}


class Table{
	constructor(labels){
		let div_table, table, tr, th;
		div_table = Utils.create('div', ['div_song_table']);
		document.body.appendChild(div_table);

		table = Utils.create('table', ['song_table']);
		div_table.appendChild(table);

		tr = document.createElement('tr');
		tr.classList.add('song_tr_labels');
		table.appendChild(tr);

		for (let label of labels) {
			th = document.createElement('th');
			th.classList.add('song_th_label');
			th.innerText = label;
			tr.appendChild(th);
		}
		this.table = table;
		this.songs = null;
		this.add_styles();
	}
	add_styles(){
		Utils.add_styles([
			'.div_song_table{display:flex; justify-content:center;}',
			'.song_tr_labels{border-bottom:2px solid black}',
			'.song_table{border-collapse:collapse}',
			'.song_tr td{height:120%}',
			'.song_tr_first td{padding-top:8px}',
			'.song_tr_last td{padding-bottom:8px}',
			'.song_tr_last{border-bottom:2px solid black}',
			'.song_title{color:deeppink;padding:8px}',
			'.song_href{text-decoration:none; color:brown; cursor:pointer}',
			'.song_length{color:green; min-width:70px; text-align:center}',
			'.song_singer{color:orange; text-align:center}',
			'.song_lang{text-align:center;color:grey}',
			'.song_ranks{color: orange; min-width:70px; text-align:center}',
			'.song_tags{color: blue; min-width:70px; text-align:center}',
			'.song_date{height:4vh; text-align:center; min-width:110px; user-select:none}',
			'.song_tags span{margin:0px 2px; padding:0px 2px; border:2px dashed gray; border-radius:40% 0%; background:lightyellow}',
			'span.面白い{color:purple}',
			'span.儿歌{color:green}',
			'span.薯片水獭{color:Turquoise;background:gray}',
			'span.蝴蝶谷逸_{color:lightyellow;background:darkgray}',
			'span.Monedula{color:AliceBlue;background:darkgray}',
			'span.真栗{color:chocolate;text-shadow:0 0 2px orange}',
			'span.BAN{color:red}',
			'h2{color:DeepSkyBlue;display:flex;justify-content:center;margin:0;text-shadow:0 0 5px DarkTurquoise;text-align:center}',
			'.td_hidden, .tr_hidden{display:none}'
		]);
	}
	create_trs(songs, new_win){
		Object.keys(songs)
		// .sort((x1, x2) => x1.localeCompare(x2, 'zh-Hans-CN'))
		.forEach(title => {
			let items = songs[title];
			// let td_title = Utils.create('td', ['song_title'], {});
			// td_title.innerText = Utils.pretty_str(title);
			// songs[title]['td_title'] = td_title;

			items.forEach((item, idx) => {
				let tr, href, date, length, singer, lang, tags, author, td, link, span, chs;
				tr = Utils.create('tr', ['song_tr'], {'title': title});

				href = item?.['href'];
				date = item?.['date'];
				length = item?.['length'];
				singer = item?.['singer'];
				lang = item?.['lang'];
				tags = item?.['tags'];
				author = item?.['author'];
				chs = item?.['chs'];

				td = Utils.create('td', ['song_title', 'td_hidden'], {});
				let title_pretty = Utils.pretty_str(title);
				td.innerText = title_pretty;
				if (chs != '') {
					let title_chs_pretty = Utils.pretty_str(chs);
					td.addEventListener('mouseover', function(e){
						this.innerText = title_chs_pretty;
					})
					td.addEventListener('mouseout', function(e){
						this.innerText = title_pretty;
					})
				}
				tr.appendChild(td);

				td = Utils.create('td', ['song_date']);
				link = Utils.create('a', ['song_href'], {
					'data-href': href,
					'data-title': title,
					'data-isClip': item['is_clip']
				});
				link.innerText = date;
				link.addEventListener('click', function(e){
					e.preventDefault();
					let btn_cycle = document.querySelectorAll('#btn_drawClipCycle.btn_active');
					if (btn_cycle.length != 0) {
						btn_cycle[0].click();
					}
					document.title = '『' + this.getAttribute('data-title') + '』';
					new_win.open(this.getAttribute('data-href'), this.getAttribute('data-length'), this.getAttribute('data-isClip'));
				});
				td.appendChild(link);
				tr.appendChild(td);

				td = Utils.create('td', ['song_length'], {});
				td.innerText = length;
				tr.appendChild(td);

				td = Utils.create('td', ['song_singer'], {'title': singer});
				td.innerText = Utils.pretty_str(singer, 10);
				tr.appendChild(td);

				td = Utils.create('td', ['song_lang']);
				td.innerText = lang;
				tr.appendChild(td);

				td = Utils.create('td', ['song_tags'], {});
				tags.forEach(tag => {
					span = Utils.create('span', [tag], {'title': tag});
					span.innerText = tag;
					td.appendChild(span);
				});
				if (author) {
					span = Utils.create('span', [author], {'title': author});
					span.innerText = Utils.pretty_str(author, 4);
					td.appendChild(span);
				} else if (tags.length == 0){
					td.innerText = '----';
				}
				tr.appendChild(td);
				item['tr'] = tr;	
			});
		});
		// console.log(songs);
	}
	init_table(songs){
		console.time('init table');
		let ret = this.init_table_inner(songs);
		console.timeEnd('init table');
		return ret;
	}
	init_table_inner(songs) {
		this.songs = songs;
		let cnt_songs = 0, cnt_clips = 0;
		Object.keys(songs)
		.sort((x1, x2) => x1.localeCompare(x2, 'zh-Hans-CN'))
		.forEach(title => {
			songs[title]
			.sort((x1, x2) => -x1['date'].localeCompare(x2['date'], 'zh-Hans-CN'))
			.forEach((item, idx) => {
				let tr = item['tr'];
				let td_title = tr.childNodes[0];

				if (idx == 0){
					td_title.classList.remove('td_hidden');
					td_title.setAttribute('rowspan', String(songs[title].length));
					cnt_songs += 1;
				} else {
					td_title.classList.add('td_hidden');
				}
				cnt_clips += 1;
				if (idx == 0){
					tr.classList.add('song_tr_first');
				} else {
					tr.classList.remove('song_tr_first');
				}
				if (idx + 1 == songs[title].length){
					tr.classList.add('song_tr_last');
				} else {
					tr.classList.remove('song_tr_last');
				}
				this.table.appendChild(tr);
			});
		});
		let h2 = document.querySelector('h2');
		if (!h2) {
			h2 = Utils.create('h2', [], {});
			document.body.querySelector('div#intro').insertAdjacentElement('afterend', h2);
		} else {
			h2.innerHTML = '';
		}
		h2.innerHTML += '已收录歌曲 ' + cnt_songs + ' 首<br />';
		h2.innerHTML += '已收录切片 ' + cnt_clips + ' 枚 ';	
	}
	update_table(songs){
		console.time('update table');
		let ret = this.update_table_inner(songs);
		console.timeEnd('update table');
		return ret;
	}
	update_table_inner(new_songs){
		let old_songs = this.songs;
		let cnt_songs = 0, cnt_clips = 0;
		Object.keys(old_songs)
		// .sort((x1, x2) => x1.localeCompare(x2, 'zh-Hans-CN'))
		.forEach(title => {
			if (!(title in new_songs)){
				old_songs[title].forEach((item, idx) => {
					item['tr'].classList.add('tr_hidden');
				});
				return;
			}
			cnt_songs += 1;
			let new_trs = []
			old_songs[title].forEach(old_item => {
				if (new_songs[title].some(new_item => new_item['tr'] == old_item['tr'])){
					old_item['tr'].classList.remove('tr_hidden');
					cnt_clips += 1;
					new_trs.push(old_item['tr']);
				} else {
					old_item['tr'].classList.add('tr_hidden');
				}
			})
			new_trs.forEach((tr, idx) => {
				if (idx == 0){
					tr.childNodes[0].setAttribute('rowspan', new_trs.length);
					tr.childNodes[0].classList.remove('td_hidden');
				} else {
					tr.childNodes[0].classList.add('td_hidden');
				}

				if (idx == 0 && idx + 1 == new_trs.length) {
					tr.classList.add('song_tr_first');
					tr.classList.add('song_tr_last');
				} else if (idx == 0){
					tr.classList.add('song_tr_first');					
					tr.classList.remove('song_tr_last');
				} else if (idx + 1 == new_trs.length) {			
					tr.classList.remove('song_tr_first');
					tr.classList.add('song_tr_last');
				} else {
					tr.classList.remove('song_tr_first');			
					tr.classList.remove('song_tr_last');
				}
			})
		});
		let h2 = document.querySelector('h2');
		if (!h2) {
			h2 = Utils.create('h2', [], {});
			document.body.querySelector('div#intro').insertAdjacentElement('afterend', h2);
		} else {
			h2.innerHTML = '';
		}
		h2.innerHTML += '已收录歌曲 ' + cnt_songs + ' 首<br />';
		h2.innerHTML += '已收录切片 ' + cnt_clips + ' 枚 ';	

	}
	clear_table(){
		document.querySelectorAll('.song_tr')
		.forEach(tr => {
			tr.remove();
		})
	}
}

class Drawers{
	constructor(new_win){
		this.new_win = new_win;
		this.song = null;
		this.clip = null;
		this.dur = null;
		this.timeout_highlight = null;
		this.timeout_cycle = null;
		this.INTERVAL_CLIPS = 0.5

		this.mount();
	}
	draw_song(){
		if (this.song && this.timeout_highlight) {
			this.song.classList.remove('highlighted')
			clearTimeout(this.timeout_highlight);
			this.timeout_highlight = null;
			this.song = null;
		}
		let songs = document.querySelectorAll('.song_tr:not(.tr_hidden) td.song_title:not(.td_hidden)');
		let idx = Math.floor(Math.random() * songs.length);
		this.song = songs[idx];
		this.song.classList.add('highlighted');
		this.timeout_highlight = setTimeout(()=>{
			this.song.classList.remove('highlighted');
			self.timeout_highlight = null;
			this.song = null;
		}, 5000);
		this.song.scrollIntoView();
		console.log(this.song.innerText);
	}
	draw_clip(){
		if (this.clip && this.timeout_highlight) {
			this.clip.classList.remove('highlighted')
			clearTimeout(this.timeout_highlight);
			this.timeout_highlight = null;
			this.clip = null;
		}
		let clips = document.querySelectorAll('.song_tr:not(.tr_hidden) td.song_date a.song_href');
		let idx = Math.floor(Math.random() * clips.length);
		this.clip = clips[idx];
		this.clip.classList.add('highlighted');
		this.timeout_highlight = setTimeout(() => {
			this.clip.classList.remove('highlighted');
			this.timeout_highlight = null;
			this.clip = null;
		}, 5000);
		this.clip.scrollIntoView();
		console.log(this.clip.getAttribute('data-title'), this.clip.innerText);
	}
	draw_clip_once(){
		if (this.clip && this.timeout_highlight) {
			this.clip.classList.remove('highlighted')
			clearTimeout(this.timeout_highlight);
			this.timeout_highlight = null;
			this.clip = null;
		}
		let trs = document.querySelectorAll('.song_tr:not(.tr_hidden)');
		let idx = Math.floor(Math.random() * trs.length);
		let tr = trs[idx];
		this.clip = tr.querySelectorAll('td.song_date a.song_href')[0];
		this.dur = tr.querySelectorAll('td.song_length')[0];
		this.clip.classList.add('highlighted');
		this.dur.classList.add('highlighted');
		this.timeout_highlight = setTimeout(() => {	
			this.clip.classList.remove('highlighted');
			this.dur.classList.remove('highlighted');
			this.clip = null;
			this.dur = null;

		}, 5000);
		this.clip.scrollIntoView();
		console.log(this.clip.getAttribute('data-title'), this.clip.innerText, this.dur.innerText, Utils.str2sec(this.dur.innerText));	
		document.title = '『' + this.clip.getAttribute('data-title') + '』';
		this.new_win.open(this.clip.getAttribute('data-href'), this.clip.getAttribute('data-length'), this.clip.getAttribute('data-isClip'));
	}
	draw_clip_cycle(){
		window.focus();
		this.draw_clip_once();
		this.timeout_cycle = setTimeout(()=>{
			this.new_win.close();
			this.draw_clip_cycle();
		}, (Utils.str2sec(this.dur.innerText) + this.INTERVAL_CLIPS) * 1000);
	}
	reset(){
		if (this.timeout_cycle){
			clearTimeout(this.timeout_cycle);
			this.timeout_cycle = null;
		}
		if (this.timeout_highlight){
			clearTimeout(this.timeout_highlight);
			this.timeout_highlight = null;
		}
		this.song = null;
		this.clip = null;
		this.dur = null;
		this.new_win.close(true);
	}
	mount(){
		Utils.add_styles([
			'.drawer_btn{margin:10px 10px;font-family:仿宋;font-size:20px;font-weight:bolder;color:gold;text-shadow:0 0 4px black; cursor:pointer;background:lightyellow;border:1px solid black;}',
			'.div_drawer{display:flex; justify-content:center;}',
			'.highlighted{font-weight:bolder; animation:highlight 3s infinite;}',
			'@keyframes highlight{0%{color:red;} 14%{color:orange} 29%{color:yellow} 43%{color:green} 57%{color:cyan} 71%{color:blue} 86%{color:purple} 100%{color:red}}',

			'#div_btn_lb div{cursor:pointer; opacity:0.5; font-size:1rem; text-align:center;border:1px solid black;height:3rem; width:3rem; background:lightgrey;}',
			'#div_btn_lb div:hover{opacity:1}',
			'#div_btn_lb{position:fixed; bottom:0.03rem; left:0; display:flex; flex-direction:column;}',
			'#div_btn_lb .btn_active{color:green; opacity:1; font-weight:bolder;}',
			'#div_btn_lb #btn_drawClipCycle #btn_fbSwitch{z-index:10; border-radius:50%; height:1.5rem; width:1.5rem; padding:0; cursor:pointer; border-width:1px; text-align:center}',
			'#div_btn_lb #btn_drawClipCycle #btn_fbSwitch.btn_fore{background:white; color:black}',
			'#div_btn_lb #btn_drawClipCycle #btn_fbSwitch.btn_back{background:grey; color:white}'
		]);
		let div_drawer = Utils.create('div', ['div_drawer'], {});
		document.querySelector('h2').insertAdjacentElement('afterend', div_drawer);

		let btn_drawSong = Utils.create('button', ['drawer_btn_song', 'drawer_btn']);
		btn_drawSong.innerText = '随机抽取歌曲';	
		btn_drawSong.addEventListener('click', this.draw_song);
		div_drawer.appendChild(btn_drawSong);

		let btn_drawClip = Utils.create('button', ['drawer_btn_clip', 'drawer_btn']);
		btn_drawClip.innerText = '随机抽取切片';	
		btn_drawClip.addEventListener('click', this.draw_clip);
		div_drawer.appendChild(btn_drawClip);

		//left-bottom
		let div_lb = Utils.create('div', [], {'id': 'div_btn_lb'})
		document.body.appendChild(div_lb);

		let div, btn, div_text;
		div = Utils.create('div', ['div_btn'], {'id': 'btn_drawSong'});
		div.innerHTML = '♪<br />歌曲';
		div.addEventListener('click', this.draw_song);
		div_lb.appendChild(div);

		div = Utils.create('div', ['div_btn'], {'id': 'btn_drawClip'});
		div.innerHTML = '✄<br />切片';
		div.addEventListener('click', this.draw_clip);
		div_lb.appendChild(div);

		div = Utils.create('div', ['div_btn'], {'id': 'btn_drawClipCycle'});
		btn = Utils.create('button', ['btn_fb_switch', PLAY_FORESTAGE ? 'btn_fore' : 'btn_back'], {'id': 'btn_fbSwitch'});
		btn.innerText = PLAY_FORESTAGE ? 'F' : 'B';
		btn.title = 'F: 切片视频前台切换\nB: 切片视频后台切换'
		div.appendChild(btn);
		div.innerHTML += '<br />循环';
		div.addEventListener('click', (e) => {
			if (e.target.id == 'btn_fbSwitch'){
				if (e.target.innerText == 'F'){
					e.target.innerText = 'B';
					e.target.classList.add('btn_back');
					e.target.classList.remove('btn_fore');
					this.new_win.set_forestage(false);
				} else {
					e.target.innerText = 'F';
					e.target.classList.add('btn_fore');
					e.target.classList.remove('btn_back');
					this.new_win.set_forestage(true);
				}
				return;
			}
			if (e.target.classList.contains('btn_active')){
				e.target.classList.remove('btn_active');
				this.reset();
				document.title = 'Makuri';
			} else {
				e.target.classList.add('btn_active');
				this.draw_clip_cycle();
			}
		});
		div_lb.appendChild(div);

		div = Utils.create('div', ['div_btn'], {'id': 'btn_backToTop'});;
		div.innerHTML = '▲<br />顶部';
		div.addEventListener('click', function(e){
			let video = document.querySelector('video.video_snow');
			if (video) {
				video.currentTime = 0;
				video.play();
			}
			window.scrollTo(0, 0);
		})
		div_lb.appendChild(div);
	}
}

class SearchBox{
	constructor(table, songs){
		this.songs = songs;
		this.table = table;
		this.prev_values = null;
		this.mount();
	}
	mount(){
		Utils.add_styles([
			'.div_search{display:flex; justify-content:center;}',
			'.hidden{display:none}'
		]);
		let div_search = Utils.create('div', ['div_search'], {});
		document.querySelector('.div_drawer').insertAdjacentElement('afterend', div_search);

		let inp = Utils.create('input', ['input_search'], {'type': 'text', 'placeholder': '搜索'});
		inp.addEventListener('keyup', (e) => {
			this.search_timer(e);
		})
		div_search.appendChild(inp);
	}
	is_filtered(item, vals){
		let title, date, tag, singer, lang, author;
		title = item?.['title'] ?? '';
		date = item?.['date'] ?? '';
		tag = item?.['tag'] ?? '';
		singer = item?.['singer'] ?? '';
		lang = item?.['lang'] ?? '';
		author = item?.['author'] ?? '';

		let attrs = [title, singer, author, tag, date, lang];
		return vals.every(val => {
			for (let key of ['title', 'date', 'tag', 'singer', 'lang', 'author']){
				let n = key.length;
				if (val.substring(0, n + 1).toLowerCase() == key + ':'){
					attrs = [item?.[key] ?? ''];
					val = val.substring(n + 1);
					break;
				}
			}
			attrs = attrs.map(attr => attr.toLowerCase());
			if (val.length != 1 && val[0] == '-'){
				return attrs.every(attr => {
					return attr.indexOf(val.substring(1)) == -1;
				})
			} else {
				return attrs.some(attr => {
					return attr.indexOf(val) != -1;
				})				
			}
		})
	}
	search_timer(e){
		console.time('search');
		let ret = this.search(e);
		console.timeEnd('search');
		return ret;
	}
	search(e){
		let values = e.target.value;
		if (values == this.prev_values){
			return;
		}
		this.prev_values = values;
		// this.table.clear_table()

		let vals = values.toLowerCase().split(' ')
		.filter(val => val != '');
		vals  = vals.filter((val, idx) => vals.indexOf(val) == idx);
		if (vals.length == 0){
			this.table.update_table(this.songs);
			return;
		}
		let new_songs = Object.keys(this.songs).reduce((new_songs, title) => {
			if (e.target.value != values) {
				return;
			}
			this.songs[title].forEach(item => {
				if (vals.length == 1 && title.indexOf(vals[0]) != -1){
					new_songs[title] = this.songs[title];
					return;
				}
				if (this.is_filtered(item, vals)){
					if (!(title in new_songs)){
						new_songs[title] = [];
						new_songs[title]['td_title'] = this.songs[title]['td_title']
					}
					new_songs[title].push(item);
				}
			});
			return new_songs;
		}, {});
		if (e.target.value != values) {
			return;
		}
		// console.log(new_songs);
		this.table.update_table(new_songs);
	}
}

class SocialPlatforms{
	constructor(){
		this.data = [
			{
				'name': '微博',
				'icon': 'https://weibo.com/favicon.ico',
				'href': 'https://weibo.com/u/2060882880',
				'color': 'rgb(221,35,39)'
			}, {
				'name': 'BiliBili',
				'icon': 'https://www.bilibili.com/favicon.ico',
				'href': 'https://space.bilibili.com/210752',
				'color': 'rgb(0,157,209)'
			}, {
				'name': '抖音',
				'icon': 'https://p-pc-weboff.byteimg.com/tos-cn-i-9r5gewecjs/favicon.png',
				'href': 'https://www.douyin.com/user/MS4wLjABAAAAZNXXGVoyN8pMcKvjIRdjVydya2ooO8-862g1ybBlmcTADPGITxsLt2Edo14ovjC7',
				'color': 'rgb(0,0,0)'
			}, {
				'name': 'QQ音乐',
				'icon': 'https://y.qq.com/favicon.ico?max_age=2592000',
				'href': 'https://y.qq.com/n/ryqq/singer/000QfzRN1PfvDi',
				'color': 'rgb(22,189,115)'
			},{
				'name': '网易云音乐',
				'icon': 'https://s1.music.126.net/style/favicon.ico?v20180823',
				'href': 'https://music.163.com/#/artist?id=12127825',
				'color': 'rgb(211,0,26)'
			},{
				'name': '小红书',
				'icon': 'https://www.xiaohongshu.com/favicon.ico',
				'href': 'https://www.xiaohongshu.com/user/profile/61f2ce4000000000100084e7',
				'color': 'rgb(242,37,61)'
			}, {
				'name': 'YouTube',
				'icon': 'https://www.youtube.com/s/desktop/3747f4fc/img/logos/favicon_144x144.png',
				'href': 'https://www.youtube.com/@makuri0731',
				'color': 'rgb(243,0,49)'
			}, {
				'name': 'instagram',
				'icon': 'https://static.cdninstagram.com/rsrc.php/v4/yI/r/VsNE-OHk_8a.png',
				'href': 'https://www.instagram.com/makuri0731/',
				'color': 'rgb(249,37,116)'
			}, {
				'name': '5sing',
				'icon': 'http://5sing.kugou.com/favicon.ico',
				'href': 'http://5sing.kugou.com/makuri/default.html',
				'color': 'rgb(28,223,92)'
			}			
		];
		this.mount();
	}
	mount(){
		Utils.add_styles([
			'#div_rt{position:fixed; top:0.8rem; right:-28px; display: flex; flex-direction: column;}',
			'#div_rt a{margin:0.25rem; display:flex; flex-direction: row; align-items: center; transition: transform 0.5s ease; z-index:100}',
			'#div_rt a img{border-radius:14px}',
			'#div_rt a .div_dec{width:24px; height:19px; display:block; }',
			'#div_rt a:hover {transform: translateX(-24px);}'
		]);
		let div_rt = Utils.create('div', [], {'id': 'div_rt'});
		document.body.appendChild(div_rt);
		this.data.forEach(item => {
			let link = Utils.create('a', [], {
				'title': '真栗栗的' + item['name'] + '主页',
				'href': item['href']
			});
			link.addEventListener('click', function(e){
				e.preventDefault();
				window.open(this.href);
			});
			div_rt.appendChild(link);

			let img = Utils.create('img', [], {
				'src': item['icon'],
				'height': '32px',
				'width': '32px',
				'style': 'border: 2px solid ' + item['color']
			});
			link.appendChild(img);

			let div_dec = Utils.create('div', ['div_dec'], {
				'style': 'background: ' + item['color'] + ';'
				+ 'border-top: 6px double white;'
				+ 'border-bottom: 6px double white;'
			});
			link.appendChild(div_dec);
		})
	}
}

class Image_RB{
	constructor(src){
		this.src = src;
		this.mount()
	}
	mount(){
		Utils.add_styles([
		'img.img_sleep{opacity:0.65;position:relative;bottom:0; height:12rem; width:auto;transform: scaleX(-1);}',
		'#div_img_rb{position:fixed; right:0; bottom:0; z-index:-1;}'
	]);
		let div_rb = Utils.create('div', [], {'id': 'div_img_rb'});
		document.body.appendChild(div_rb);

		let img = Utils.create('img', ['img_sleep'], {'src': this.src});
		div_rb.appendChild(img);
	}
}

// class MouseFollow{
// 	constructor(){
// 		this.follower = null;
// 		this.follower_x = null;
// 		this.follower_y = null;
// 		this.mouse_x = null;
// 		this.mouse_y = null;
// 		this.is_disappearing = false;
// 		this.offset_x = 40;
// 		this.offset_y = 40;

// 		this.mount();
// 	}
// 	mount(){
// 		Utils.add_styles([
// 			'.mouse_follow{position:fixed; height:4rem; width:4rem; top:-1000px; left:-1000px; background:red; z-index:-1;}',
// 			'.mouse_follow_appear{opacity:0.9}',
// 			'.mouse_follow_disappear{opacity:0; animation:follower_disappear 2s ease;}',
// 			'@keyframes follower_disappear{0%{opacity:0.9} 100%{opacity:0}}',
// 			'.face_left{transform: scaleX(-1);}',
// 			'.face_right{transform: scaleX(1);}',
// 			'.img_follow{width:100%;height:100%}'
// 		])
// 		let div = Utils.create('div', ['mouse_follow'], {});
// 		document.body.appendChild(div);
// 		let img = Utils.create('img', ['img_follow'], {'src': 'follower.png'});
// 		div.appendChild(img);


// 		this.follower = div;
// 		let computed_style = window.getComputedStyle(div)
// 		this.follower_wh = computed_style.width;
// 		this.follower_hh = computed_style.height;
// 		this.follower_wh = parseInt(this.follower_wh.substring(0, this.follower_wh.length - 2)) / 2;
// 		this.follower_hh = parseInt(this.follower_hh.substring(0, this.follower_hh.length - 2)) / 2;
// 		// console.log(this.follower_wh, this.follower_hh);
// 		window.addEventListener('mousemove', (e) => {
// 			this.mouse_x = e.clientX;
// 			this.mouse_y = e.clientY;
// 		})
// 		setInterval(()=>{this.follow()}, 10);
// 	}
// 	follow(){
// 		// console.log(this)
// 		// console.log(this.mouse_x, this.follower_x, this.is_disappearing)
// 		if (this.mouse_x == null && this.mouse_y == null){
// 			return;
// 		}
// 		if (this.follower_x == null || this.follower_y == null){
// 			this.appear();
// 			this.follower_x = this.mouse_x;
// 			this.follower_y = this.mouse_y;
// 			this.follower.style.left = this.follower_x - this.follower_wh + 'px';
// 			this.follower.style.top = this.follower_y - this.follower_hh + 'px';
// 			return;		
// 		}
// 		if (Math.abs(this.mouse_x - this.follower_x) > this.offset_x || Math.abs(this.mouse_y - this.follower_y) > this.offset_y){
// 			this.appear();
// 			this.is_disappearing = false;
// 		}
// 		if (this.is_disappearing) {
// 			this.disappear()
// 			return;
// 		}
// 		this.follower_x += Math.max(Math.min(this.mouse_x - this.follower_x, this.offset_x), -this.offset_x);
// 		this.follower_y += Math.max(Math.min(this.mouse_y - this.follower_y, this.offset_y), -this.offset_y);
// 		if (this.follower_x == this.mouse_x && this.follower_y == this.mouse_y){
// 			this.is_disappearing = true;
// 		}
// 		if (this.mouse_x < this.follower_x){
// 			this.face('right');
// 		} else if (this.mouse_x > this.follower_x){			
// 			this.face('left');
// 		}
// 		this.follower.style.left = this.follower_x - this.follower_wh + 'px';
// 		this.follower.style.top = this.follower_y - this.follower_hh + 'px';

// 	}
// 	appear(){
// 		this.follower.classList.remove('mouse_follow_disappear');
// 		this.follower.classList.add('mouse_follow_appear');
// 	}
// 	disappear(){
// 		this.follower.classList.remove('mouse_follow_appear');
// 		this.follower.classList.add('mouse_follow_disappear');
// 	}
// 	face(dir){
// 		if (dir == 'right'){
// 			this.follower.classList.remove('face_left');
// 			this.follower.classList.add('face_right');
// 		} else if (dir == 'left'){
// 			this.follower.classList.add('face_left');
// 			this.follower.classList.remove('face_right');
// 		}
// 	}
// }



function main(){
	const TAGS = {
	"BAN": ['百万个吻', '骗赖', '你跟我比夹夹', '嘉宾', '香水有毒', '纤夫的爱', '天上掉下个猪八戒', '通天大道宽又阔', '大哥欢迎你', '好汉歌'],
	"面白い": ['百万个吻', '骗赖', '香水有毒', '通天大道宽又阔', '你跟我比夹夹', 'TMD我爱你', '闹啥子嘛闹', '810975', '忐忑', '蕉蕉'],
	"儿歌": ['小鲤鱼历险记', '我爱洗澡', '勇气大爆发', '我会自己上厕所']
}

	let loader = new DataLoader(TAGS);	

	// loader.json2songs(loader.load_data('./真栗.json'), video_author='真栗');
	// loader.json2songs(loader.load_data('./Monedula.json'), video_author='Monedula');
	// loader.csv2songs(loader.load_data('./薯片水獭.csv'), video_author='薯片水獭');
	loader.json2songs_timer(loader.load_data('./真栗.json'), video_author='真栗');
	loader.json2songs_timer(loader.load_data('./Monedula.json'), video_author='Monedula');
	loader.json2songs_timer(loader.load_data('./蝴蝶谷逸_.json'), video_author='蝴蝶谷逸_');
	loader.csv2songs_timer(loader.load_data('./薯片水獭.csv'), video_author='薯片水獭');
	console.log(loader.length);
	console.log(Object.keys(loader.songs).length);

	let new_win = new NewWin();
	let table = new Table(['Title', 'Date', 'Dur.', 'O.S.', 'Lang.', 'Tags']);
	table.create_trs(loader.songs, new_win);
	table.init_table(loader.songs);

	let drawers = new Drawers(new_win);
	let search_box = new SearchBox(table, loader.songs);

	let social_platforms = new SocialPlatforms();
	let img_rb = new Image_RB('./sleep.png');
	// let mouse_follow = new MouseFollow();

}
main();