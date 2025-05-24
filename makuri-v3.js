// TODO: Keep-Alive
// 邪道 后面研究下web workers+service worker
// setInterval(() => {console.log(1)}, 1000);
function keepAliveBySilentAudio(){
	let audio = document.createElement('audio');
	audio.src = './assets/audios/silent.mp3';
	audio.autoplay = true;
	audio.loop = true;
	document.body.appendChild(audio);
}
keepAliveBySilentAudio();


class LRUCache{
	constructor(capacity){
		this.cap = capacity;
		this.cache = new Map();
	}
	get(key){
		if (!this.cache.has(key)){
			return null;
		}
		this.make_recent(key);
		return this.cache.get(key);
	}
	put(key, val){
		if (this.cache.has(key)){
			this.cache.set(key, val);
			this.make_recent(key);
			return;
		}
		if (this.cache.size >= this.capacity){
			const del_key = this.cache.keys().next().value;
			this.cache.delete(del_key);
		}
		this.cache.set(key, val);
	}
	make_recent(key){
		const val = this.cache.get(key);
		this.cache.delete(key);
		this.cache.set(key, val);
	}
}


class OrderedDict{
	constructor(){
		this.map = new Map();
		return new Proxy(this.map, {
			get: (target, prop) => {
				if (typeof prop === 'symbol' || prop in Map.prototype || prop in target){
					const value = target[prop];
					return typeof value === 'function' ? value.bind(target) : value;
				}
				return target.get(prop);
			},
			set: (target, prop, value) => {
				if (prop in Map.prototype || prop in target){
					return false;
				}
				target.set(prop, value);
				return true;
			},
			has: (target, prop) => target.has(prop),
			ownKeys: (target) => [...target.keys()],
			getOwnPropertyDescriptor: (target, prop) => ({
				value: this.map.get(prop),
				writable: true,
				enumerable: true,
				configurable: true,
			}),
		});
	}
}

class Utils{
	constructor(){}
	static pretty_date(date){
		if (!date) {return '####';}
		if (!date.includes('-')){
			return date.substring(0, 4) + '-' + date.substring(4, 6) + '-' + date.substring(6, 8);
		}
		date = date.split('-');
		if (date[1].length == 1) {
			date[1] = '0' + date[1];
		}
		if (date[2].length == 1) {
			date[2] = '0' + date[2];
		}
		return date.join('-');
	}
	static pretty_str(str, max_len=25){
		const reg = /[\u4E00-\u9FFF\u3400-\u4DBF\U00020000-\U0002A6DF\U0002A700-\U0002B73F\U0002B740-\U0002B81F\U0002B820-\U0002CEAF\U0002CEB0-\U0002EBEF\U00030000-\U0003134F\U00031350-\U000323AF\U0002EBF0-\U0002EE5F\U0002F800-\U0002FA1F\uF900-\uFAFF\u2F00-\u2FDF\u2E80-\u2EFF\u31C0-\u31EF\u2FF0-\u2FFF]/;
		let cnt = 0;
		for (let i = 0; i < str.length; i += 1){
			cnt += reg.test(str[i]) ? 1.5 : 1;
			if (i != str.length - 1 && cnt > max_len - 1){
				return str.substring(0, i) + '…';
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
		document.head.appendChild(tag);
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
	static preciseSetTimeout(duration){
		let start_time = Date.now();
		let expectation = duration;
		let _interval = 1000;
		function step(){
			let now_time = Date.now();
			let remaining = duration - now_time + start_time;
			if (remaining <= 0){
				return;
			}
			let next_timeout = _interval - (now_time - start_time) + expectation;
			expectation += _interval;
			setTimeout(step, Math(0, next_timeout));
		}
		setTimeout(step, _interval);
	}
	static sleep(ms){
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	static debounce(fn, delay){
		let timeout;
		return function(){
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				fn.apply(this, arguments)
			}, delay);
		};
	}
}
const PLAY_FOREGROUND = Utils.get_cookie('play_foreground') == 'true' ? true : false;


class ClipBoard{
	constructor(){
		this.copy = this.copy_new
		this.notification = new Notification();
	}
	copy_new(text){
		navigator.clipboard.writeText(text)
		.then(() => {
			this.copy_success(text);
		})
		.catch((error) => console.log(error))
	}
	copy_old(text){
		let textarea = Utils.createElement('textarea');
		textarea.value = text;
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);
		this.copy_success(text);
	}
	copy_success(text){
		if (this.notification){
			this.notification.notify(text);
			return;
		}
		window.alert('成功复制 『' + text + '』 到剪贴板');
	}
}


class DataLoader{
	constructor(TAGS){
		this.songs = {};
		this.ordered_songs = new OrderedDict();
		this.songs_info = JSON.parse(this.load_data('./assets/jsons/songs_info.json'));
		this.TAGS = TAGS
		this.titles = [];

		this.ms_now = Date.now();
	}
	get length(){
		let cnt = 0;
		let songs = Object.keys(this.songs).length != 0 ? this.songs : this.ordered_songs;
		Object.keys(songs).forEach(title => {
			cnt += songs[title].length;
		});
		return cnt;
	}
	//TODO: 同步->异步，Promise.all()
	load_data(path){
		let request = new XMLHttpRequest();
		request.open('GET', path, false);
		request.send(null);
		if (request.status == 404){
			return null;
		}
		if (request.responseText.indexOf('<!DOCTYPE html>') != -1) {
			return null;
		}
		return request.responseText;
	}
	json2songs_timer(data, video_author=null){
		console.time('json2songs_timer');
		let ret = this.json2songs(data, video_author);
		console.timeEnd('json2songs_timer');
		return ret
	}
	json2songs(data, video_author=null){
		if (data == '') return;
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
			in_pt = Utils.str2sec(data[bvid]?.['in_pt']) ?? 0.0001;
			in_pt = in_pt == 0 ? 0.0001 : in_pt;
			out_pt = Utils.str2sec(data[bvid]?.['out_pt']) ?? null;
			length = out_pt == null ? length : Utils.sec2str(parseInt(out_pt - in_pt));
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
				in_pt = Utils.str2sec(parts[p]?.['in_pt']) ?? 0.0001;
				in_pt = in_pt == 0 ? 0.0001 : in_pt;
				out_pt = Utils.str2sec(parts[p]?.['out_pt']) ?? null;
				length = length ?? Utils.sec2str(parseInt(out_pt - in_pt));
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
		if (data == '') return;
		let bvid, date, page, in_pt, out_pt, title, tags, singer, href, item;
		let lines = data.split('\r\n');
		for (let line of lines){
			item = line.split(',');
			if (item.every(x => x == '')){
				continue;
			}
			bvid = item[0] === '' ? bvid : item[0].match(/BV[\da-zA-Z]{10}/)[0];
			date = item[1] === '' ? date : item[1];
			page = item[2] === '' ? page : item[2]
			in_pt = Utils.str2sec(item[3]);
			in_pt = (in_pt == 0 ? 0.0001 : in_pt);
			out_pt = Utils.str2sec(item[4]);
			// console.log(title);
			title = item[5];
			tags = item.length >= 7 ? item[6].trim() : '';
			singer = item.length >= 8 ? item[7] : '';

			href = 'https://www.bilibili.com/video/' + bvid + '/?t=' + in_pt + '&p=' + page.substring(1);
			this.add_song({
				'title': title,
				'date': date,
				'href': href,
				'length': Utils.sec2str(parseInt(out_pt - in_pt)),
				'singer': singer,
				'lang': '',
				'tags': tags === '' ? [] : tags.split(' '),
				'author': video_author,
				'is_clip': true,
				'is_seperate': tags.includes('follow')
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
		if (tags.includes('follow')){
			item = this.songs[title].pop();
			item['length'] = Utils.sec2str(Utils.str2sec(item['length']) + Utils.str2sec(length));
			item['tags'] = item['tags'].concat(tags.filter(x => x != 'follow'));
			item['tags'] = item['tags'].filter((tag, idx) => item['tags'].indexOf(tag) == idx);
			item['tag'] = item['tags'].join(' ').toLowerCase();
			this.songs[title].push(item);
			return;
		}
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
	
		this.songs[title].push({
			'title': chs == '' ? title.toLowerCase() : title.toLowerCase() + '|' + chs.toLowerCase(),
			'date': '▶ ' + Utils.pretty_date(date),
			'href': href,
			'length': length,
			'singer': singer,
			'lang': lang,
			'tags': tags,
			'tag': tags.join(' ').toLowerCase(),
			'author': author,
			'is_clip': is_clip,
			'chs': chs,
			'is_song': !RegExp('舞|cos展示').test(tags.join(' ').toLowerCase())
		});
	}
	get uncollected_songs(){
		let uncollected_songs = [];
		Object.keys(this.songs_info).forEach(title => {
			if (!(this.ordered_songs.has(title))){
				uncollected_songs.push(title);
			}
		});
		return uncollected_songs.sort((x1, x2) => x1.localeCompare(x2, 'zh-Hans-CN'));
	}
	sort_songs(){
		this.ordered_songs.clear();
		// this.titles = Object.keys(this.songs).sort((x1, x2) => x1.localeCompare(x2, 'zh-Hans-CN'));
		Object.keys(this.songs)
		.sort((x1, x2) => x1.localeCompare(x2, 'zh-Hans-CN'))
		.forEach(title => {
			this.ordered_songs[title] = this.songs[title].sort((x1, x2) => -x1['date'].localeCompare(x2['date']));
		});
		Object.keys(this.ordered_songs).forEach(title => {
			let gap = (this.ms_now - Date.parse(this.ordered_songs[title][0]['date'].substring(2) + ' 00:00'));
			gap = gap / 365 / 24 / 60 / 60 / 1000;
			this.ordered_songs[title].forEach((item, idx) => {
				this.ordered_songs[title][idx]['gap'] = gap.toString();
			});
		})
		;
		this.songs = {};
	}
	get_cnts(){
		let cnt_song = {}, cnt_clip = {};
		this.ordered_songs.keys().forEach(title => {
			let clips = this.ordered_songs[title];
			let set = new Set();
			clips.forEach(clip => {
				let singer = clip?.['singer'];
				if (singer == null){
					return;
				}
				if (!set.has(singer)){
					set.add(singer);
					if (!(singer in cnt_song)){
						cnt_song[singer] = 0;
					}
					cnt_song[singer] += 1;
				}
				if (!(singer in cnt_clip)){
					cnt_clip[singer] = 1;
				} else {
					cnt_clip[singer] += 1;
				}
			})
		})
		let arr = [];
		Object.keys(cnt_clip).forEach(singer => {
			arr.push([cnt_clip[singer], singer]);
		})
		arr = arr.filter(x => x != '');
		arr.sort((x1, x2) => {
			if (x1[0] == x2[0]){
				return x1[1].localeCompare(x2[1], 'zh-Hans-CN');
			}
			return x2[0] - x1[0];
		})
		console.log('切片最多的歌手:');
		arr.slice(0, 10).forEach(x => console.log(x[0], x[1]));

		arr = [];
		Object.keys(cnt_song).forEach(singer => {
			arr.push([cnt_song[singer], singer]);
		})
		arr = arr.filter(x => x[1] != '');
		arr.sort((x1, x2) => {
			if (x1[0] == x2[0]){
				return x1[1].localeCompare(x2[1], 'zh-Hans-CN');
			}
			return x2[0] - x1[0];
		})
		console.log('歌曲最多的歌手:');
		arr.slice(0, 10).forEach(x => console.log(x[0], x[1]));

		let max_titles = new Map();
		this.ordered_songs.entries().forEach(([title, items], idx) => {
			let n = items.length;
			if (max_titles.has(n)){
				max_titles.get(n).push(title);
				return;
			}
			if (max_titles.size == 0){
				max_titles.set(n, [title]);
				return;
			}
			let min_cnt = Math.min(...Array.from(max_titles.keys()));
			if (n < min_cnt) return;
			if (max_titles.size < 10){
				max_titles.set(n, [title]);
			} else {
				max_titles.delete(min_cnt);
				max_titles.set(n, [title]);
			}
		});
		console.log('切片最多的歌曲:');
		Array.from(max_titles.keys()).sort((a, b) => b - a).forEach(cnt => {
			console.log(cnt, max_titles.get(cnt).join('/'));
		})
	}
	get_total_duration(){
		let duration = 0, dur;
		this.ordered_songs.keys().forEach(title => {
			this.ordered_songs[title].forEach(item => {
				dur = item?.['length'];
				duration += dur ? Utils.str2sec(dur) : 0;
			})
		})
		console.log('Total DUR: ' + Utils.sec2str(duration));
	}
}


class NewWin{
	constructor(play_foreground=PLAY_FOREGROUND){
		this.new_win = null;
		this.timeout_close = null;
		this.play_foreground = play_foreground;
	}
	get isAvailable(){
		return this.new_win != null && !this.new_win.closed;
	}
	close(force=false){
		if ((force || this.play_foreground) && this.isAvailable){
			this.new_win.close();
			this.new_win = null;
			document.title = 'Makuri';
		}
	}
	get open(){
		return this.play_foreground ? this.open_url : this.change_url;
	}
	change_url(url, duration=null, is_cycle=false, is_seperate=false){
		if (!this.isAvailable){
			this.open_url(url, duration, is_cycle);
			return;
		}
		if (this.timeout_close){
			clearTimeout(this.timeout_close);
			this.timeout_close = null;
		}
		this.new_win.location.href = url;
		if (!is_cycle && duration != null) {
			this.timeout_close = setTimeout(()=>{
				this.close(true);
			}, (Utils.str2sec(duration) + 1 + (is_seperate ? 0.5 : 0)) * 1000);
		}

	}
	open_url(url, duration=null, is_cycle=false, is_seperate=false){
		if (this.timeout_close) {
			clearTimeout(this.timeout_close);
			this.timeout_close = null;
		}
		this.close();
		this.new_win = window.open(url);
		if (!is_cycle && duration != null) {
			this.timeout_close = setTimeout(()=>{
				this.close(true);
			}, (Utils.str2sec(duration) + 1 + (is_seperate ? 0.5 : 0)) * 1000);
		}
	}
	set_foreground(flag) {	
		this.play_foreground = flag;
		Utils.set_cookie('play_foreground', flag);
	}
	get foreground(){
		return this.play_foreground;
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
		this.clipboard = new ClipBoard();
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
			'.song_title{color:deeppink;padding:8px; cursor:pointer; user-select:none;}',
			'.song_title:hover{font-weight:bolder}',
			'.song_href{text-decoration:none; color:brown; cursor:pointer}',
			'.song_length{color:green; min-width:70px; text-align:center}',
			'.song_singer{color:orange; text-align:center}',
			'.song_lang{text-align:center;color:grey}',
			'.song_ranks{color: orange; min-width:70px; text-align:center}',
			'.song_tags{color: blue; min-width:70px; display:flex; flex-direction:row; justify-content:flex-start; padding-left:2rem}',
			'.song_date{height:4vh; text-align:center; min-width:7rem; user-select:none}',
			'.song_date:hover{font-weight:bolder}',
			'.song_tags span{margin:0px 2px; padding:0px 2px; border:2px dashed gray; border-radius:40% 0%; background:lightyellow}',
			'span.面白い{color:purple}',
			'span.儿歌{color:green}',
			'span.author{min-width:4rem;text-align:center;}',
			'span.录播组{color:NavajoWhite;background:gray}',
			'span.薯片水獭{color:Turquoise;background:gray}',
			'span.蝴蝶谷逸{color:lightyellow;background:darkgray}',
			'span.Monedula{color:AliceBlue;background:darkgray}',
			'span.真栗{color:chocolate;text-shadow:0 0 2px orange}',
			'span.BAN{color:red; font-weight:bold; text-decoration:line-through;}',
			'span.cos{color:gold; font-weight:bold; text-shadow:0 0 0.3rem #533806; background:#819cea;}',
			'h2{color:DeepSkyBlue;display:flex;justify-content:center;margin:0;text-shadow:0 0 5px DarkTurquoise;text-align:center}',
			'.td_hidden, .tr_hidden{display:none}'
		]);
	}
	init_table_inner(songs, new_win){
		this.songs = songs;
		let cnt_songs = 0, cnt_clips = 0;
		Object.keys(songs)
		.forEach(title => {
			let items = songs[title];
			// let td_title = Utils.create('td', ['song_title'], {});
			// td_title.innerText = Utils.pretty_str(title);
			// songs[title]['td_title'] = td_title;

			items.forEach((item, idx) => {
				let tr, href, date, length, singer, lang, tags, author, td, link, span, chs;
				tr = Utils.create('tr', ['song_tr'], {'data-title': title});

				href = item?.['href'];
				date = item?.['date'];
				length = item?.['length'];
				singer = item?.['singer'];
				lang = item?.['lang'];
				tags = item?.['tags'];
				author = item?.['author'];
				chs = item?.['chs'];

				td = Utils.create('td', ['song_title', 'td_hidden'], {'title': title});
				let title_pretty = Utils.pretty_str(title);
				td.innerText = title_pretty;
				if (chs != '') {
					let title_chs_pretty = Utils.pretty_str(chs);
					td.addEventListener('mouseover', function(e){
						this.innerText = title_chs_pretty;
						this.style.color = 'DodgerBlue';
					})
					td.addEventListener('mouseout', function(e){
						this.innerText = title_pretty;
						this.style.color = 'deeppink';
					})
				}
				td.addEventListener('click', (e) => {;
					this.clipboard.copy(e.target.parentNode.getAttribute('data-title'));
				})
				tr.appendChild(td);

				td = Utils.create('td', ['song_date']);
				link = Utils.create('a', ['song_href'], {
					'data-href': href,
					'data-title': title,
					'data-length': length,
					'data-isSeperate': item['is_seperate']
				});
				link.innerText = date;
				link.addEventListener('click', function(e){
					e.preventDefault();
					let btn_cycle = document.querySelectorAll('#btn_drawClipCycle.btn_active');
					if (btn_cycle.length != 0) {
						btn_cycle[0].setAttribute('close_win', new_win.foreground);
						btn_cycle[0].click();
						btn_cycle[0].removeAttribute('close_win');
					}
					document.title = '『' + this.getAttribute('data-title') + '』';
					new_win.open(this.getAttribute('data-href'), this.getAttribute('data-length'), false, this.getAttribute('data-isSeperate'));
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
				if (author) {
					span = Utils.create('span', [author, 'author'], {'title': author});
					span.innerText = Utils.pretty_str(author, 6);
					td.appendChild(span);
				} else if (tags.length == 0){
					td.innerText = '----';
				}
				tags.forEach(tag => {
					span = Utils.create('span', [tag], {});
					span.innerText = tag;
					if (tag.includes('cos')){
						span.classList.add('cos');
					}
					td.appendChild(span);
				});
				tr.appendChild(td);
				item['tr'] = tr;


				// mount
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
		// console.log(songs);
		let h2 = document.querySelector('h2');
		if (!h2) {
			h2 = Utils.create('h2', [], {});
			document.body.querySelector('div#intro').insertAdjacentElement('afterend', h2);
		} else {
			h2.innerHTML = '';
		}
		h2.innerHTML += '已收录歌曲 ' + cnt_songs + ' 首<br />';
		h2.innerHTML += '已收录切片 ' + cnt_clips + ' 枚 ';

		const cursor = new Cursor(`./assets/jsons/points.json`);		
	}
	init_table(songs, new_win){
		console.time('init table');
		let ret = this.init_table_inner(songs, new_win);
		console.timeEnd('init table');
		return ret;
	}
	init_table_inner1(songs) {
		return;

		this.songs = songs;
		let cnt_songs = 0, cnt_clips = 0;
		Object.keys(songs)
		.forEach(title => {
			songs[title]
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
			if (new_songs[title].some(item => item['is_song'])){
				cnt_songs += 1;
			}
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
		this.INTERVAL_CLIPS = 1

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
		let ms = (Utils.str2sec(this.dur.innerText) + this.INTERVAL_CLIPS) * 1000;
		ms += this.clip.getAttribute('is_seperate') == "true" ? 500 : 0;
		this.timeout_highlight = setTimeout(() => {	
			this.clip.classList.remove('highlighted');
			this.clip = null;
			this.dur = null;

		}, ms);
		this.clip.scrollIntoView();
		console.log(this.clip.getAttribute('data-title'), this.clip.innerText, this.dur.innerText, Utils.str2sec(this.dur.innerText));	
		document.title = '『' + this.clip.getAttribute('data-title') + '』';
		this.new_win.open(this.clip.getAttribute('data-href'), this.clip.getAttribute('data-length'), true);
		return ms;
	}
	draw_clip_cycle(){
		window.focus();
		let ms = this.draw_clip_once();
		this.timeout_cycle = setTimeout(()=>{
			this.new_win.close();
			this.draw_clip_cycle();
		}, ms);
	}
	reset(close_win){
		if (this.song){
			this.song.classList.remove('highlighted');
			this.song = null;
		}
		if (this.clip){
			this.clip.classList.remove('highlighted');
			this.clip = null;
		}
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
		this.new_win.close(close_win);
	}
	mount(){
		Utils.add_styles([
			'.drawer_btn{margin:10px 10px;font-family:仿宋;font-size:20px;font-weight:bolder;color:gold;text-shadow:0 0 4px black; cursor:pointer;background:lightyellow;border:1px solid black;}',
			'.div_drawer{display:flex; justify-content:center;}',
			'.highlighted{font-weight:bolder; animation:highlight 3s infinite;}',
			'@keyframes highlight{0%{color:red;} 14%{color:orange} 29%{color:yellow} 43%{color:green} 57%{color:cyan} 71%{color:blue} 86%{color:purple} 100%{color:red}}',

			'#div_btn_lb div{cursor:pointer; opacity:0.5; font-size:1rem; text-align:center;border:0px solid black;height:3rem; width:3rem; background:lightgrey; user-select:none; position:relative;}',
			'#div_btn_lb div:hover{opacity:1}',
			'#div_btn_lb{position:fixed; bottom:0.03rem; left:0; display:flex; flex-direction:column;}',
			'#div_btn_lb .btn_active{color:GoldenRod; opacity:1; font-weight:bolder; text-shadow:0 0 0.1rem brown;}',
			'#div_btn_lb #btn_drawClipCycle #btn_fbSwitch{z-index:10; border-radius:50%; height:1.5rem; width:1.5rem; padding:0; cursor:pointer; border-width:1px; text-align:center}',
			'#div_btn_lb #btn_drawClipCycle #btn_fbSwitch.btn_fore{background:white; color:black}',
			'#div_btn_lb #btn_drawClipCycle #btn_fbSwitch.btn_back{background:grey; color:white}',
			'.div_btn svg{position:absolute; top:0; left:0; width:3rem; height:3rem; pointer-events:none;}',
			'.div_btn svg rect{fill:none; width:3rem; height:3rem; stroke-width:4; stroke:DarkGoldenRod; stroke-dasharray:12rem; stroke-dashoffset:0; transition: stroke-dashoffset 2.5s ease;}',
			'.div_btn:hover svg rect{stroke-dasharray:12rem; stroke-dashoffset:24rem;}'
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
		let svg, rect;
		let div_lb = Utils.create('div', [], {'id': 'div_btn_lb'})
		document.body.appendChild(div_lb);

		let div, btn, div_text;
		div = Utils.create('div', ['div_btn'], {'id': 'btn_drawSong'});
		div.addEventListener('click', this.draw_song);
		div_lb.appendChild(div);
		svg = Utils.create('svg', [], {});
		div.appendChild(svg);
		rect = Utils.create('rect', [], {});
		svg.appendChild(rect);
		div.innerHTML += '♪<br />歌曲';


		div = Utils.create('div', ['div_btn'], {'id': 'btn_drawClip'});
		div.addEventListener('click', this.draw_clip);
		div_lb.appendChild(div);
		svg = Utils.create('svg', [], {});
		div.appendChild(svg);
		rect = Utils.create('rect', [], {});
		svg.appendChild(rect);
		div.innerHTML += '✄<br />切片';

		div = Utils.create('div', ['div_btn'], {'id': 'btn_drawClipCycle'});
		svg = Utils.create('svg', [], {});
		div.appendChild(svg);
		rect = Utils.create('rect', [], {});
		svg.appendChild(rect);
		btn = Utils.create('button', ['btn_fb_switch', PLAY_FOREGROUND ? 'btn_fore' : 'btn_back'], {'id': 'btn_fbSwitch'});
		btn.innerText = PLAY_FOREGROUND ? 'F' : 'B';
		btn.title = 'F: 切片视频前台切换\nB: 切片视频后台切换'
		div.appendChild(btn);
		div.innerHTML += '<br />循环';
		div.addEventListener('click', (e) => {
			if (e.target.id == 'btn_fbSwitch'){
				if (e.target.innerText == 'F'){
					e.target.innerText = 'B';
					e.target.classList.add('btn_back');
					e.target.classList.remove('btn_fore');
					this.new_win.set_foreground(false);
				} else {
					e.target.innerText = 'F';
					e.target.classList.add('btn_fore');
					e.target.classList.remove('btn_back');
					this.new_win.set_foreground(true);
				}
				return;
			}
			if (e.target.classList.contains('btn_active')){
				e.target.classList.remove('btn_active');
				// console.log(e.target.getAttribute('close_win') == 'true' ? true: false)
				this.reset(e.target.getAttribute('close_win') == 'false' ? false: true);
				document.title = 'Makuri';
			} else {
				e.target.classList.add('btn_active');
				this.draw_clip_cycle();
			}
		});
		div_lb.appendChild(div);

		div = Utils.create('div', ['div_btn'], {'id': 'btn_backToTop'});;
		svg = Utils.create('svg', [], {});
		div.appendChild(svg);
		rect = Utils.create('rect', [], {});
		svg.appendChild(rect);
		div.innerHTML += '▲<br />顶部';
		div.addEventListener('click', function(e){
			let video = document.querySelector('video.video_snow');
			if (video && video.paused) {
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
		this.cache_kv = new LRUCache(20);
		this.cache_search = new LRUCache(50);
		this.prev_values = null;

		this.inp_search = null;
		this.select_search = null;
		this.mount();
	}
	mount(){
		Utils.add_styles([
			'.div_search{display:flex; justify-content:center;}',
			'.hidden{display:none}',
			'.input_search{min-width:15rem; margin:0 0.5rem;}',
			'#select_presets option{text-align:center}',
			'.div_search a{height:1.2rem; width:1.2rem; align-items:center; display:flex; justify-content:center; border-radius:50%; border:0.2rem solid grey; font-weight:500; color:grey; text-decoration:none; cursor:pointer; opacity:0.6; font-weight:bolder;}',
			'.div_search a:hover{opacity:1; border:0.2rem solid skyblue; color:skyblue;}',
			'#select_presets option{font-family:Arial,sans-serif; font-weight:500;}',
		]);
		let div_search = Utils.create('div', ['div_search'], {});
		document.querySelector('.div_drawer').insertAdjacentElement('afterend', div_search);

		let select = Utils.create('select', [], {'id':'select_presets'});
		let items = new Map([
			['🌟 ALL 🌟', ''],
			['⁺✞ʚ 🌰 ɞ✟₊', '-谭姐 -姨妈'],
			['周杰伦 专场', 'singer:周杰伦 -半首'],
			['邓紫棋 专场', 'singer:邓紫棋 -半首'],
			['王心凌 专场', 'singer:王心凌 -半首'],
			['梁静茹 专场', 'singer:梁静茹 -半首'],
			['孙燕姿 专场', 'singer:孙燕姿 -半首'],
			['张韶涵 专场', 'singer:张韶涵 -半首'],
			['陶喆 专场', 'singer:陶喆 -半首'],
			['王菲 专场', 'singer:王菲 -半首'],
			['初音ミク 专场', 'singer:初音 -半首'],
			['谭姐 专场', 'title:谭姐'],
			['日语 专场', 'lang:日语'],
			['韩语 专场', 'lang:韩语'],
			['粤语 专场', 'lang:粤语'],
			['👶儿歌👶 专场', 'tag:儿歌'],
			['❤️情人节❤️ 专场', 'date:05-20|02-14|03-14|24-08-10|23-08-22|21-08-14|20-08-25'],
			['🎀COS🎀 专场', 'tag:cos'],
			['🍺干杯🍺 专场', 'date:22-03-28|23-09-06|25-01-01'],
			['2021精选(蝴蝶谷逸_)', 'tag:2021精选'],
			['距最近收录已有1️⃣年', 'gap:>=1 -+'],
			['距最近收录已有2️⃣年', 'gap:>=2 -+'],
			['距最近收录已有3️⃣年', 'gap:>=3 -+'],
			['距最近收录已有4️⃣年', 'gap:>=4 -+']
		]);
		items.entries().forEach((entry) => {
			let [text, value] =[...entry];
			let opt = Utils.create('option', [], {});
			opt.text = text;
			opt.value = value;
			select.appendChild(opt);
		});
		select.addEventListener('change', (e) => {
			if (this.inp_search) {
				this.inp_search.value = e.target.value;
			}
			this.search_timer(e);
		})
		div_search.appendChild(select);
		this.select_search = select;


		let inp = Utils.create('input', ['input_search'], {'type': 'search', 'placeholder': '搜索'});
		const search_debounce = Utils.debounce(this.search_timer.bind(this), 200);
		inp.addEventListener('keyup', (e) => {
			if (this.select_search) {
				this.select_search.value = -1;
			}
			// this.search_timer(e);
			search_debounce(e);
		});
		this.inp_search = inp;
		div_search.appendChild(inp);

		let a = Utils.create('a', ['link_guide'], {});
		a.innerText = '?';
		a.title = '常规搜索：xxxx yyyy\n排除搜索：-xxxx\n并列搜索：xxxx|yyyy\n定类搜索：title/date/singer/lang/tag/author/gap:xxxx\n限定日期：date:xx-xx-xx~yy-yy-yy\n限定间隔：gap:(==|>|<|>=|<=|!=)ff\n组合搜索：参考预设'
		a.addEventListener('click', e => {
			 window.open('https://www.bilibili.com/video/BV1StEPzsEbK/');
		})
		div_search.appendChild(a);
	}
	get_keys_vals(expr){
		let cache_key = this.cache_kv.get(expr);
		if (cache_key != null) return cache_key;

		let _expr = expr.split(':');
		let all_keys = ['title', 'date', 'tag', 'singer', 'lang', 'author', 'gap'];

		let ret_keys = new Set();
		if (_expr.length == 1){
			ret_keys = ['title', 'date', 'tag', 'singer', 'lang', 'author'];
		} else {
			_expr[0].split('|').forEach(_k => {
				all_keys.forEach(k => {
					if (k == _k){
						ret_keys.add(_k);
						return;
					}
				})
			})
			if (ret_keys.size == 0) {
				ret_keys = ['title', 'date', 'tag', 'singer', 'lang', 'author'];
			}
		}
		_expr = _expr.length == 1 ? _expr.join('') : _expr.slice(1).join('')
		let ret_vals = new Set(_expr.split('|').filter(x => x!= ''));

		this.cache_kv.put(expr, [Array.from(ret_keys), Array.from(ret_vals)]);
		return this.cache_kv.get(expr);
	}
	is_filtered(item, exprs){
		// let title, date, tag, singer, lang, author;
		// title = item?.['title'] ?? '';
		// date = item?.['date'] ?? '';
		// tag = item?.['tag'] ?? '';
		// singer = item?.['singer'] ?? '';
		// lang = item?.['lang'] ?? '';
		// author = item?.['author'] ?? '';


		return exprs.every(expr => {
			// console.log(expr)
			let keys, vals;
			[keys, vals] = [...this.get_keys_vals(expr)];
			// console.log(keys, vals)
			let is_dateRange = keys.length == 1 && keys[0] == 'date' ? true : false;
			let is_gap = keys.length == 1 && keys[0] == 'gap' ? true : false;

			let attrs = keys.map(key => item?.[key].toLowerCase() ?? '');
			return vals.some(val => {
				if (is_dateRange && val.indexOf('~') != -1){
					let [start, end] = [...val.split('~').map(x => x.trim())];
					let _date = attrs[0].substring(4);
					return start.localeCompare(_date) == -1 && _date.localeCompare(end) == -1;
				}
				if (is_gap) {
					let ret;
					try{
						ret = eval(attrs[0] + val);
					} catch {
						return false;
					}
					return ret;
				}
				if (val.length != 1 && val[0] == '-'){
					return attrs.every(attr => {
						return attr.indexOf(val.substring(1)) == -1;
					})
				} else {
					return attrs.some(attr => {
						return attr.indexOf(val) != -1;
					})				
				}
			});
		})
	}
	search_timer(e){
		console.time('search');
		console.log(this);
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
		let new_songs = this.cache_search.get(values);
		if (new_songs == null) {
			new_songs = Object.keys(this.songs).reduce((new_songs, title) => {
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
				this.cache_search.put(values, new_songs);
				return new_songs;
			}, {});
		} else {
			console.log(`[${values}] cached`);
		}
		
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
				'icon': './assets/imgs/favicon_youtube.png',
				// 'icon': 'https://www.youtube.com/s/desktop/3747f4fc/img/logos/favicon_144x144.png',
				// 'icon': 'https://s1.aigei.com/src/img/png/46/46e4d6a5e62b4b9497432fce6703ebc8.png?imageMogr2/auto-orient/thumbnail/!282x282r/gravity/Center/crop/282x282/quality/85/%7CimageView2/2/w/282&e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:F9zbgQl_PX8Fw9kHd8ghtXuzocg=',
				'href': 'https://www.youtube.com/@makuri0731',
				'color': 'rgb(243,0,49)'
			}, {
				'name': 'instagram',
				'icon': './assets/imgs/favicon_instagram.png',
				// 'icon': 'https://static.cdninstagram.com/rsrc.php/v4/yI/r/VsNE-OHk_8a.png',
				// 'icon': 'https://s1.aigei.com/src/img/png/9c/9c38c5c69c244cb48457ac975eb829fb.png?imageMogr2/auto-orient/thumbnail/!282x282r/gravity/Center/crop/282x282/quality/85/%7CimageView2/2/w/282&e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:pAa_1Zek7DGJ-MfCrpDGLZL20rY=',
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
			'#div_rt{position:fixed; top:0.8rem; right:-29px; display: flex; flex-direction: column;}',
			'#div_rt a{margin:0.25rem; display:flex; flex-direction: row; align-items: center; transition: transform 0.5s ease; z-index:100}',
			'#div_rt a img{border-radius:14px; background:white}',
			'#div_rt a .div_dec{width:24px; height:19px; display:block; transform: translateX(-4px); z-index:-1;}',
			'#div_rt a:hover {transform: translateX(-20px);}'
		]);
		let div_rt = Utils.create('div', [], {'id': 'div_rt'});
		document.body.appendChild(div_rt);
		const pattern = /(https?:\/\/[^/]*)/i;
		this.data.forEach(item => {
			const match = item['href'].match(pattern);
			if (match && match[1]){
				document.head.appendChild(Utils.create('link', [], {'rel': 'dns-prefetch', 'href': match[1]}));
			}

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
		'#div_img_rb{position:fixed; right:0; bottom:0; z-index:-1; display:flex;}'
	]);
		let div_rb = Utils.create('div', [], {'id': 'div_img_rb'});
		document.body.appendChild(div_rb);

		let img = Utils.create('img', ['img_sleep'], {'src': this.src});
		div_rb.appendChild(img);
	}
}

class Notification{
	constructor(){
		this.timeouts = [];
		this.max_cnt = 8;
		this.mount();
	}
	mount(){
		Utils.add_styles([
			'#div_notify{position:fixed; top:0; right:3rem; height:0vh; width:25rem;}',
			'.notification{height:9.2vh; width:100%; top:-9.2vh; background:aliceblue; color:ForestGreen; font-size:1.2rem; font-weight:bolder; border-radius:10px; border:5px double brown;margin:0.4vh 0; box-sizing: content-box; display:flex; flex-direction: column; align-items:center; justify-content:center; position:relative; animation:disappear 5s ease, slide 5s; ease}',
			'@keyframes disappear{0%{opacity:0} 8%{opacity:1} 70%{opacity:1} 100%{opacity:0.3}}',
			'@keyframes slide{0%{top:100vh} 8%{top:0} 95%{top:0} 100%{top:-22%}}',
			'.notification span{color:DarkGoldenRod; font-size:1.2rem; text-align:center;}'
		]);

		let div = Utils.create('div', [], {'id': 'div_notify'});
		document.body.appendChild(div);
		this.div = div;
	}
	notify(text){
		if (this.timeouts.length >= this.max_cnt){
			let timeout = this.timeouts.shift();
			clearTimeout(timeout);
			this.div.removeChild(this.div.childNodes[0]);
		}
		let notification = Utils.create('div', ['notification'], {});
		notification.innerHTML = '<span>『' + text + '』</span>已成功复制！ ';
		this.div.appendChild(notification)
		this.timeouts.push(
			setTimeout(((div, notification, timeouts) => {
							div.removeChild(notification);
							timeouts.shift();
						}).bind(null, this.div, notification, this.timeouts)
			, 4900)
		);
	}
}

class Cursor{
	constructor(path){
		this.points = this.load_points(path);
		this.mount();
	}
	load_points(path){
		let request = new XMLHttpRequest(path);
		request.open('GET', path, false);
		request.send(null);
		if (request.status == 404){
			return;
		}
		if (request.responseText.indexOf('<!DOCTYPE html>') != -1) {
			return;
		}
		return JSON.parse(request.responseText);
	}
	mount(){
		Utils.add_styles([
			'#cursor{position:fixed; top:0; left:0; pointer-events:none; z-index:10}',
			'#cursor .point{position:absolute; top:0; left:-0.5rem; width:0.235rem; height:0.235rem; border-radius:45%; }',
			'#cursor .point.disappear{animation: disappear 1s linear forwards}'
		])
		let cursor = Utils.create('div', [], {'id': 'cursor'});
		let sign_x = Math.floor(Math.random() * 2);
		let sign_y = Math.floor(Math.random() * 2);
		Object.keys(this.points)
		.sort((x1, x2) => -parseInt(x1) + parseInt(x2))
		.forEach(idx => {
			let x = this.points[idx]['x'];
			let y = this.points[idx]['y'];
			let rgba = this.points[idx]['rgba'];
			rgba = 'rgba(' + rgba.join(',') + ')';
			let scale = this.points[idx]?.['scale'] ?? 1;
			// console.log(scale)
			let span = Utils.create('span', ['point'], {});
			// span.style.setProperty('--i', idx);
			span.style.left = x * 0.275 + 'rem';
			span.style.top  = y * 0.275 + 'rem';
			let x0 = 105;
			let y0 = Math.random() * 100;
			span.style.transform = `translate(${x0}vw, ${y0}vh) scale(${scale})`;
			span.style.boxShadow = `0 0 0.5rem ${rgba}`;
			span.style.background = rgba;
			cursor.appendChild(span);
		})
		document.body.appendChild(cursor);
		// this.stagger_spans = 0.001
		// this.interval_move = 30;
		// this.lasttime_move = 0;
		// this.prev_x = -1000;
		// this.prev_y = -1000;
		// this.min_dis = 15;
		// document.addEventListener('mousemove', e => {
		// 	let nowtime_move = Date.now();
		// 	if (nowtime_move - this.lasttime_move <= this.interval_move) return;
		// 	let x = e.clientX, y = e.clientY;
		// 	// if (Math.abs(x - this.prev_x) < this.min_dis && Math.abs(y - this.prev_y) < this.min_dis)
		// 	// 	return;
		// 	this.lasttime_move = nowtime_move;
		// 	// this.prev_x = x;
		// 	// this.prev_y = y;
		// 	gsap.to('.point', {
		// 		x: e.clientX,
		// 		y: e.clientY,
		// 		ease: "back.out(1.4)",
		// 		stagger: 0.0025
		// 	});
		// 	// anime.waapi.animate('.point', {
		// 	// 	x: {to: e.clientX},
		// 	// 	y: {to: e.clientY},
		// 	// 	delay:anime.stagger(2.5)
		// 	// });
		// });
		let move_points = Utils.debounce(((e) => {	
			gsap.to('.point', {
				x: e.clientX,
				y: e.clientY,
				ease: 'back.out(1.2)',
				stagger:0.0025
			});
		}).bind(this), 1)
		document.addEventListener('mousemove', function(e){
			gsap.to('.point', {
				x: e.clientX,
				y: e.clientY,
				ease: 'back.out(1.2)',
				stagger:0.0025
			});
			// move_points(e);
		});
	}
}

class BGColor{
	constructor(){
		this.mount();
	}
	mount(){
		Utils.add_styles([
			'#div_bg{width:100vw; height:100vh; position:fixed; top:0; left:0; background-image:linear-gradient(135deg, white, #272727d6); z-index:-10000;}'
		]);
		 let div = Utils.create('div', [], {'id': 'div_bg'});
		 document.body.appendChild(div);

	}
}


function main(){
	let social_platforms = new SocialPlatforms();
	let img_rb = new Image_RB('./assets/imgs/sleep.png');



	const TAGS = {
	"BAN": ['百万个吻', '骗赖', '你跟我比夹夹', '嘉宾', '香水有毒', '纤夫的爱', '天上掉下个猪八戒', '通天大道宽又阔', '大哥欢迎你', '好汉歌'],
	"面白い": ['百万个吻', '骗赖', '香水有毒', '通天大道宽又阔', '你跟我比夹夹', 'TMD我爱你', '闹啥子嘛闹', '810975', '忐忑', '蕉蕉'],
	"儿歌": ['小鲤鱼历险记', '我爱洗澡', '勇气大爆发', '我会自己上厕所', '加油鸭', '巴啦啦小魔仙', '小小鹿', '别看我是一只羊', '宝贝宝贝', '白龙马', '葫芦娃', '大家一起喜羊羊', '天上掉下个猪八戒']
}

	console.time('LOAD JSON/CSV');
	let loader = new DataLoader(TAGS);
	loader.json2songs_timer(loader.load_data('./assets/jsons/真栗.json') ?? '', video_author='真栗');	
	loader.json2songs_timer(loader.load_data('./assets/jsons/Monedula.json') ?? '', video_author='Monedula');
	loader.json2songs_timer(loader.load_data('./assets/jsons/蝴蝶谷逸_.json'), video_author='蝴蝶谷逸');
	loader.csv2songs_timer(loader.load_data('./assets/csvs/薯片水獭.csv') ?? '', video_author='薯片水獭');
	loader.csv2songs_timer(loader.load_data('./assets/csvs/真栗栗录播组_Clean.csv') ?? '', video_author='录播组');
	loader.csv2songs_timer(loader.load_data('./assets/csvs/真栗栗录播组_Selfuse.csv') ?? '', video_author='录播组');
	loader.json2songs_timer(loader.load_data('./assets/jsons/真栗栗录播组.json') ?? '', video_author='录播组');
	loader.json2songs_timer(loader.load_data('./assets/jsons/南夕君cC.json') ?? '', video_author='南夕君cC');
	loader.sort_songs();
	loader.get_cnts();
	loader.get_total_duration();
	console.log(loader.length);
	console.log(Object.keys(loader.ordered_songs).length);
	console.log(loader.uncollected_songs);
	console.timeEnd('LOAD JSON/CSV');

	let new_win = new NewWin();
	let table = new Table(['Title', 'Date', 'Dur.', 'O.S.', 'Lang.', 'Tags']);
	table.init_table(loader.ordered_songs, new_win);
	// table.init_table(loader.ordered_songs);

	let drawers = new Drawers(new_win);
	let search_box = new SearchBox(table, loader.ordered_songs);

	// setTimeout(()=>{
	// 	let idx = Math.floor(Math.random() * 4) + 1;
	// 	let cursor = new Cursor(`./points${idx}.json`);
	// }, 0);
}
console.time('MIAN');
main();
console.timeEnd('MIAN');