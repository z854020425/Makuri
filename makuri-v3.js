
const PLAY_BACKSTAGE = false;

const DEBUG_MODE = false;
console.log = DEBUG_MODE ? console.log : ()=>{};
console.time = DEBUG_MODE ? console.time : ()=>{};
console.timeEnd = DEBUG_MODE ? console.timeEnd : ()=>{};

// Keep-Alive
setInterval(()=>{console.info(1);}, 5000);



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
}


class DataLoader{
	constructor(TAGS){
		this.songs = {};
		this.songs_info = JSON.parse(this.load_data('./songs_info.json'));
		this.TAGS = TAGS
	}
	get length(){
		let cnt = 0;
		Object.keys(this.songs).forEach(title => {
			cnt += this.songs[title]['items'].length;
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
		let title, date, href, length, singer, lang, tags, author, is_clip, item;
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
			this.songs[title] = {};
			this.songs[title]['items'] = [];
		}
		Object.keys(this.TAGS).forEach(TAG => {
			if (this.TAGS[TAG].includes(title)){
				tags.unshift(TAG);
			}
		});
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
			item = this.songs[title]['items'].pop();
			item['length'] = Utils.sec2str(Utils.str2sec(item['length']) + Utils.str2sec(length));
			item['tags'] = item['tags'].concat(tags.filter(x => x != 'follow'));
			item['tags'] = item['tags'].filter((tag, idx) => item['tags'].indexOf(tag) == idx);
			item['tag'] = item['tags'].join(' ').toLowerCase();
			this.songs[title]['items'].push(item);
			return;
		}
		this.songs[title]['items'] .push({
			'title': title.toLowerCase(),
			'date': Utils.pretty_date(date),
			'href': href,
			'length': length,
			'singer': singer,
			'lang': lang,
			'tags': tags,
			'tag': tags.join(' ').toLowerCase(),
			'author': author,
			'is_clip': is_clip
		});
	}
}


class NewWin{
	constructor(play_backstage=PLAY_BACKSTAGE){
		this.new_win = null;
		this.timeout_close = null;
		this.open = play_backstage ? this.change_url : this.open_url;
	}
	get isAvailable(){
		return this.new_win && !this.new_win.closed;
	}
	close(){
		if (this.isAvailable){
			this.new_win.close();
			this.new_win = null;
		}
	}
	change_url(url, duration=null, is_clip=false){
		if (!this.isAvailable){
			this.open_url(url, duration);
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
		this.new_win = window.open(url);
		if (is_clip && duration != null) {
			this.timeout_close = setTimeout(()=>{
				this.close();
			}, (str2sec(duration) + 0.5) * 1000);
		}
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
			'span.Monedula{color:AliceBlue;background:darkgray}',
			'span.真栗{color:chocolate;text-shadow:0 0 2px orange}',
			'span.BAN{color:red}',
			'h2{color:DeepSkyBlue;display:flex;justify-content:center;margin:0;text-shadow:0 0 5px DarkTurquoise;text-align:center}'
		]);
	}
	create_trs(songs, new_win){
		Object.keys(songs)
		.sort((x1, x2) => x1.localeCompare(x2, 'zh-Hans-CN'))
		.forEach(title => {
			let items = songs[title]['items'];
			let td_title = Utils.create('td', ['song_title'], {});
			td_title.innerText = Utils.pretty_str(title);
			songs[title]['td_title'] = td_title;

			items.sort((x1, x2) => -x1['date'].localeCompare(x2['date']))
			.forEach((item, idx) => {
				let tr, href, date, length, singer, lang, tags, author, td, link, span;
				tr = Utils.create('tr', ['song_tr'], {'title': title});

				href = item?.['href'];
				date = item?.['date'];
				length = item?.['length'];
				singer = item?.['singer'];
				lang = item?.['lang'];
				tags = item?.['tags'];
				author = item?.['author'];

				td = Utils.create('td', ['song_date']);
				link = Utils.create('a', ['song_href'], {
					'data-href': href,
					'data-title': title,
					'data-isClip': item['is_clip']
				});
				link.innerText = date;
				link.addEventListener('click', function(e){
					e.preventDefault();
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
		console.log(songs);
	}
	update_table(songs){
		console.time('update');
		let ret = this.update_table_inner(songs);
		console.timeEnd('update');
		return ret;
	}
	update_table_inner(songs) {
		let cnt_songs = 0, cnt_clips = 0;
		Object.keys(songs)
		.sort((x1, x2) => x1.localeCompare(x2, 'zh-Hans-CN'))
		.forEach(title => {
			let td_title = songs[title]['td_title'];
			songs[title]['items'].forEach((item, idx) => {
				let tr = item['tr'];
				let song_td_title = tr.querySelectorAll('td.song_title');
				if (song_td_title.length != 0){
					tr.removeChild(song_td_title[0]);
				}
				if (idx == 0){
					td_title.setAttribute('rowspan', String(songs[title]['items'].length));
					tr.childNodes[0].insertAdjacentElement('beforeBegin', td_title);
					cnt_songs += 1;
				}
				cnt_clips += 1;
				if (idx == 0){
					tr.classList.add('song_tr_first');
				} else {
					tr.classList.remove('song_tr_first');
				}
				if (idx + 1 == songs[title]['items'].length){
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
		let songs = document.querySelectorAll('.song_tr td.song_title');
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
		let clips = document.querySelectorAll('.song_tr td.song_date a.song_href');
		let idx = Math.floor(Math.random() * clips.length);
		this.clip = clips[idx];
		this.clip.classList.add('highlighted');
		this.timeout_highlight = setTimeout(() => {
			this.clip.classList.remove('highlighted');
			this.timeout_highlight = null;
			this.clip = null;
		}, 5000);
		this.clip.scrollIntoView();
		console.log(this.clip.getAttribute('date-title'), clip.innerText);
	}
	draw_clip_once(){
		if (this.clip && this.timeout_highlight) {
			this.clip.classList.remove('highlighted')
			clearTimeout(this.timeout_highlight);
			this.timeout_highlight = null;
			this.clip = null;
		}
		let trs = document.querySelectorAll('.song_tr');
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
		console.log(this.clip.getAttribute('data-title'), this.clip.innerText);	
		this.clip.click();
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
		this.new_win.close();
	}
	mount(){
		Utils.add_styles([
			'.drawer_btn{margin:10px 10px;font-family:仿宋;font-size:20px;font-weight:bolder;color:gold;text-shadow:0 0 4px black; cursor:pointer;background:lightyellow;border:1px solid black;}',
			'.div_drawer{display:flex; justify-content:center;}',
			'.highlighted{font-weight:bolder; animation:highlight 3s infinite;}',
			'@keyframes highlight{0%{color:red;} 14%{color:orange} 29%{color:yellow} 43%{color:green} 57%{color:cyan} 71%{color:blue} 86%{color:purple} 100%{color:red}}',

			'#div_btn_lb button{cursor:pointer; opacity:0.5; font-size:1rem;}',
			'#div_btn_lb button:hover{opacity:1}',
			'#div_btn_lb{position:fixed; bottom:0.03rem; left:0; display:flex; flex-direction:column;}',
			'#div_btn_lb button.btn_active{color:green; opacity:1; font-weight:bolder;}'
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

		let btn;
		btn = Utils.create('button', [], {'id': 'btn_drawSong'});
		btn.innerHTML = '♪<br />歌曲';
		btn.addEventListener('click', this.draw_song);
		div_lb.appendChild(btn);

		btn = Utils.create('button', [], {'id': 'btn_drawClip'});
		btn.innerHTML = '✄<br />切片';
		btn.addEventListener('click', this.draw_clip);
		div_lb.appendChild(btn);

		btn = Utils.create('button', [], {'id': 'btn_drawClipCycle'});
		btn.innerHTML = '◎<br />循环';
		btn.addEventListener('click', (e) => {
			if (e.target.classList.contains('btn_active')){
				e.target.classList.remove('btn_active');
				this.reset();
				document.title = 'Makuri';
			} else {
				e.target.classList.add('btn_active');
				this.draw_clip_cycle();
			}
		});
		div_lb.appendChild(btn);

		btn = Utils.create('button', [], {'id': 'btn_backToTop'});;
		btn.innerHTML = '▲<br />顶部';
		btn.addEventListener('click', function(e){
			let video = document.querySelector('video.video_snow');
			if (video) {
				video.currentTime = 0;
				video.play();
			}
			window.scrollTo(0, 0);
		})
		div_lb.appendChild(btn);
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
			return attrs.some(attr => {
				return attr.indexOf(val) != -1;
			})
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
		this.table.clear_table()

		let vals = values.toLowerCase().split(' ')
		.filter(val => val != '');
		vals  = vals.filter((val, idx) => vals.indexOf(val) == idx);
		if (vals.length == 0){
			this.table.update_table(this.songs);
			return;
		}
		let new_songs = Object.keys(this.songs).reduce((new_songs, title) => {
			this.songs[title]['items'].forEach(item => {
				if (vals.length == 1 && title.indexOf(vals[0]) != -1){
					new_songs[title] = this.songs[title];
					return;
				}
				if (this.is_filtered(item, vals)){
					if (!(title in new_songs)){
						new_songs[title] = {};
						new_songs[title]['items'] = [];
						new_songs[title]['td_title'] = this.songs[title]['td_title']
					}
					new_songs[title]['items'].push(item);
				}
			});
			return new_songs;
		}, {});
		if (e.target.value != values) {
			return;
		}
		console.log(new_songs);
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
	loader.csv2songs_timer(loader.load_data('./薯片水獭.csv'), video_author='薯片水獭');
	console.log(loader.length);
	console.log(Object.keys(loader.songs).length);

	let new_win = new NewWin();
	let table = new Table(['Title', 'Date', 'Dur.', 'O.S.', 'Lang.', 'Tags']);
	table.create_trs(loader.songs, new_win);
	table.update_table(loader.songs);

	let drawers = new Drawers(new_win);
	let search_box = new SearchBox(table, loader.songs);

	let social_platforms = new SocialPlatforms();
	let img_rb = new Image_RB('./sleep.png');

}
main();