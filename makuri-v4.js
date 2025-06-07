if('serviceWorker' in navigator){
	navigator.serviceWorker.register('./sw.js');
}
// TODO: Keep-Alive
// 邪道 后面研究下worker
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
		if(!this.cache.has(key)) return null;
		this.make_recent(key);
		return this.cache.get(key);
	}
	put(key, val){
		if(this.cache.has(key)){
			this.cache.set(key, val);
			this.make_recent(key);
			return;
		}
		if(this.cache.size == this.cap){
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
				if(typeof prop === 'symbol' || prop in Map.prototype || prop in target){
					const value = target[prop];
					return typeof value === 'function' ? value.bind(target) : value;
				}
				return target.get(prop);
			},
			set: (target, prop, value) => {
				if(prop in Map.prototype || prop in target)
					return false;
				target.set(prop, value);
				return true;
			},
			has: (target, prop) => target.has(prop),
			ownKeys: (target) => [...target.keys()],
			getOwnPropertyDescriptor: (target, prop) => ({
				value: this.map.get(prop),
				writable: true,
				enumerable: true,
				configurable: true
			})
		});
	}
}


class Utils{
	constructor(){}
	static pretty_date(date){
		if(!date) 
			return 'N/A';
		if(!date.includes('-')) 
			return date.length == 8 ? `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}` : 'N/A';
		if(date.includes('-'))
			date = date.split('-');
		else if(date.includes('.'))
			date = date.split('.');
		else if(date.includes('/'))
			date = date.split('/');
		if(date[0].length == 2){
			date[0] = `20${date[0]}`
		}
		date[1] = date[1].padStart(2, '0');
		date[2] = date[2].padStart(2, '0');
		return date.join('-')
	}
	static pretty_str(str, n=25){
		if (str == null)
			return;
		const reg = /[\u4E00-\u9FFF\u3400-\u4DBF\U00020000-\U0002A6DF\U0002A700-\U0002B73F\U0002B740-\U0002B81F\U0002B820-\U0002CEAF\U0002CEB0-\U0002EBEF\U00030000-\U0003134F\U00031350-\U000323AF\U0002EBF0-\U0002EE5F\U0002F800-\U0002FA1F\uF900-\uFAFF\u2F00-\u2FDF\u2E80-\u2EFF\u31C0-\u31EF\u2FF0-\u2FFF]/;
		let cnt = 0;
		for(let i = 0; i < str.length; i++){
			cnt += reg.test(str[i]) ? 1.5 : 1;
			if(i != str.length -1 && cnt > n - 1){
				return str.substring(0, i) + '…';
			}
		}
		return str;
	}
	static sec2str(sec){
		if(!Number.isInteger(sec)) return;
		let str = '';
		if(sec > 3600){
			str += Math.floor(sec / 3600).toString().padStart(2, '0') + ':';
			sec %= 3600;
		}
		str += Math.floor(sec / 60).toString().padStart(2, '0') + ':';
		str += (sec % 60).toString().padStart(2, '0');
		return str;
	}
	static str2sec(str){
		if(typeof str != 'string') return;
		let sec = 0;
		str.split(':')
		.filter(x => x != '')
		.forEach(x => {
			sec = sec * 60 + parseFloat(x);
		});
		return sec;
	}
	static add_styles(styles){
		if(Array.isArray(styles)){
			styles = styles.join('\n');
		}
		const ele = document.createElement('style');
		ele.innerText = styles;
		document.head.appendChild(ele);
	}
	static create(tag_name, class_names=[], attrs={}){
		const ele = document.createElement(tag_name);
		class_names.forEach(class_name => ele.classList.add(class_name));
		Object.keys(attrs).forEach(key => {
			ele.setAttribute(key, attrs[key]);
		});
		return ele;
	}
	static get_cookie(key){
		let val = null;
		document.cookie.split(';')
		.forEach(cookie => {
			cookie = cookie.split('=');
			if(cookie.length != 2)
				return;
			if(cookie[0].trim() == key.trim()){
				val = unescape(cookie[1].trim());
				return;
			}
		});
		return val;
	}
	static set_cookie(key, val){
		let cookies_dict = {};
		document.cookie.split(';')
		.forEach(cookie => {
			cookie = cookie.split('=');
			if(cookie.length != 2)
				return;
			cookies_dict[cookie[0].trim()] = cookie[1].trim();
		});
		cookies_dict[String(key)] = String(val);
		let cookies_str = '';
		Object.keys(cookies_dict).forEach(key => {
			cookies_str += `${key}=${cookies_dict[key]};`;
		});
		console.log(cookies_str)
		document.cookie = cookies_str;
	}
	static get_storage(key){
		return localStorage.getItem(String(key));
	}
	static set_storage(key, val){
		localStorage.setItem(String(key), String(val));
	}
	static sleep(ms){
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	static debounce(func, delay){
		let timeout;
		return function(){
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				func.apply(this, arguments);
			}, delay);
		};
	}
}


class Notification{
	constructor(){
		this.timeouts = [];
		this.max_num = 8;
		this.mount();
	}
	mount(){
		Utils.add_styles([
			'#div_notify{position:fixed; top:0; right:3rem; height:0vh; width:25rem; z-index:20;}',
			'.notification{height:9.2vh; width:100%; top:-9.2vh; background:aliceblue; color:ForestGreen; font-size:1.2rem; font-weight:bolder; border-radius:10px; border:5px double brown;margin:0.4vh 0; box-sizing: content-box; display:flex; flex-direction: column; align-items:center; justify-content:center; position:relative; animation:disappear 5s ease, slide 5s; ease}',
			'@keyframes disappear{0%{opacity:0; height:9.2vh;} 8%{opacity:1;} 70%{opacity:1; } 90%{opacity:0; height:9.2vh} 100%{opacity:0; height:0;}}',
			'@keyframes slide{0%{top:100vh} 8%{top:0} 95%{top:0} 100%{top:-22%}}',
			'.notification span{color:DarkGoldenRod; font-size:1.2rem; text-align:center;}'
		]);
		const div = Utils.create('div', [], {'id': 'div_notify'});
		document.body.appendChild(div);
		this.div = div;
	}
	notify(text){
		while(this.timeouts.length >= this.max_num){
			clearTimeout(this.timeouts.shift());
			this.div.removeChild(this.div.childNodes[0]);
		}
		const notification = Utils.create('div', ['notification'], {});
		notification.innerHTML = `<span>『${text}』</span>已成功复制！`;
		this.div.appendChild(notification);
		this.timeouts.push(
			setTimeout(((div, notification, timeouts) => {
				div.removeChild(notification);
				timeouts.shift();
			}).bind(null, this.div, notification, this.timeouts), 4900)
		);
	}
}


class ClipBoard{
	constructor(){
		this.copy = this.copy_new;
		this.notification = new Notification();
	}
	copy_new(text){
		navigator.clipboard.writeText(text)
		.then(() => {
			this.copy_success(text);
		})
		.catch((error) => console.log(error));
	}
	copy_old(text){
		const textarea = Utils.create('textarea');
		textarea.value = text;
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);
		this.copy_success(text);
	}
	copy_success(text){
		if(this.notification){
			this.notification.notify(text);
			return;
		}
		window.alert(`『${text}』已成功复制！`);
	}
}


class DataLoader{
	constructor(TAGS){
		this.songs = {}
		this.ordered_songs = new OrderedDict();
		this.songs_info = JSON.parse(this.load_data('./assets/jsons/songs_info.json'));
		this.TAGS = TAGS

		this.ms_now = Date.now();
	}
	get num_songs(){
		const songs = this.ordered_songs.size == 0 ? this.songs : this.ordered_songs;
		return Object.keys(songs).filter(title => songs[title].some(item => item['is_song'])).length;
	}
	get num_clips(){
		let cnt = 0;
		const songs = this.ordered_songs.size == 0 ? this.songs : this.ordered_songs;
		Object.keys(songs).forEach(title => {
			cnt += songs[title].length
		});
		return cnt;
	}
	load_data(path){
		const request = new XMLHttpRequest();
		request.open('GET', path, false);
		request.send(null);
		if(request.status == 404)
			return null;		
		if(request.responseText.indexOf('<!DOCTYPE html>') != -1)
			return null;
		return request.responseText;
	}
	fetch_data(path){
		return fetch(path)
		.then(response => {
			if(!response.ok){
				throw Error(`${path} Error`);
			}
			return response.text();
		})
	}
	json2songs_timer(data, video_author=null){
		console.time('json2songs_timer');
		this.json2songs(data, video_author);
		console.timeEnd('json2songs_timer');
	}
	json2songs(data, video_author=null){
		if(!data || data == '') 
			return;
		try{
			data = JSON.parse(data);
		}catch{
			return;
		}
		let title, date, length, singer, lang, parts, tags, in_pt, out_pt;
		let duration, href, href_raw;
		Object.keys(data).forEach(bvid => {
			if(bvid[0] == '?')
				return;
			title = data[bvid]?.['title'];
			date = data[bvid]?.['date'];
			length = data[bvid]?.['length'];
			singer = data[bvid]?.['singer'];
			lang = data[bvid]?.['lang'];
			parts = data[bvid]?.['parts'];
			tags = data[bvid]?.['tags'] ?? [];
			in_pt = data[bvid]?.['in_pt'];
			out_pt = data[bvid]?.['out_pt'];

			in_pt = Math.max(Utils.str2sec(in_pt) ?? 0.0001);
			out_pt = Utils.str2sec(out_pt);
			duration = out_pt ? Math.round(out_pt - in_pt) : Utils.str2sec(length);
			length = out_pt ? Utils.sec2str(duration) : length;
			href_raw = `https://www.bilibili.com/video/${bvid}/?t=${in_pt}`;
			href = `https://www.bilibili.com/blackboard/player.html?bvid=${bvid}&t=${in_pt}&high_quality=1&autoplay=1`;
			if(!parts){
				this.add_song({
					'title': title,
					'date': date,
					'href':href,
					'href_raw': href_raw,
					'length': length,
					'singer': singer,
					'lang': lang,
					'tags': tags,
					'author': video_author,
					'duration': duration,
					'out_pt': out_pt
				});
				return;
			}
			let part;
			Object.keys(parts).forEach(p => {
				part = parts[p]?.['part'];
				title = parts[p]?.['title'];
				date = parts[p]?.['date'] ?? date;
				title = parts[p]?.['title'];
				length = parts[p]?.['length'];
				singer = parts[p]?.['singer'];
				lang = parts[p]?.['lang'];
				tags = parts[p]?.['tags'] ?? [];
				in_pt = parts[p]?.['in_pt'];
				out_pt = parts[p]?.['out_pt'];


				in_pt = Math.max(0.0001, Utils.str2sec(in_pt) ?? 0.0001);
				out_pt = Utils.str2sec(out_pt);
				duration = out_pt ? Math.round(out_pt - in_pt) : Utils.str2sec(length);
				length = out_pt ? Utils.sec2str(duration) : length;
				href_raw = `https://www.bilibili.com/video/${bvid}/?t=${in_pt}&p=${part}`;
				href = `https://www.bilibili.com/blackboard/player.html?bvid=${bvid}&t=${in_pt}&p=${part}&high_quality=1&autoplay=1`;
				this.add_song({
					'title': title,
					'date': date,
					'href':href,
					'href_raw': href_raw,
					'length': length,
					'singer': singer,
					'lang': lang,
					'tags': tags,
					'author': video_author,
					'duration': duration,
					'out_pt': out_pt
				});
				return;
			})
		})
	}
	csv2songs_timer(data, video_author=null){
		console.time('csv2songs_timer');
		let ret = this.csv2songs(data, video_author);
		console.timeEnd('csv2songs_timer');
		return ret
	}
	csv2songs(data, video_author=null){
		if(data == '')
			return;
		if(data.indexOf('<!DOCTYPE html>') != -1)
			return;
		let bvid, date, page, in_pt, out_pt, title, tags, singer, href, href_raw, item;
		const lines = data.split('\r\n');
		for(let line of lines){
			item = line.split(',');
			if(item.every(x => x.trim() == ''))
				continue;
			// console.log(item)
			if(item[0] != ''){
				const match_res = item[0].match(/BV[0-9a-zA-Z]{10}/);
				if(match_res)
					bvid = match_res[0];
				else{
					console.error(`${item} error`);	
					continue;
				}

			}
			// bvid = item[0] === '' ? bvid : item[0].match(/BV[0-9a-zA-Z]{10}/)[0];
			date = item[1] === '' ? date : item[1];
			page = item[2] === '' ? page : item[2];
			in_pt = Math.max(0.0001, Utils.str2sec(item[3]));
			out_pt = Utils.str2sec(item[4]);
			let duration = out_pt - in_pt;
			let length = Utils.sec2str(Math.round(duration));
			// console.log(in_pt, out_pt, length, duration)

			title = item[5];
			tags = item.length >= 7 ? item[6].split(' ').filter(x => x!= '') : [];
			singer - item.length >= 8 ? item[7] : null;
			href_raw = `https://www.bilibili.com/video/${bvid}/?t=${in_pt}&p=${page.substring(1)}`;
			href = `https://www.bilibili.com/blackboard/player.html?bvid=${bvid}&t=${in_pt}&p=${page.substring(1)}&high_quality=1&autoplay=1`;
			this.add_song({
				'title': title,
				'date': date,
				'href':href,
				'href_raw': href_raw,
				'length': length,
				'duration': duration,
				'singer': singer,
				'lang': null,
				'tags': tags,
				'author': video_author,
				'is_clip': true,
				'is_seperate': tags.includes('follow'),
				'out_pt': out_pt
			});
		}
	}
	add_song(item){
		let title, date, href, href_raw, length, singer, lang, tags, author, duration, out_pt;
		title = item?.['title'];
		date = item?.['date'];
		href = item?.['href'];
		href_raw = item?.['href_raw'];
		length = item?.['length'];
		singer = item?.['singer'];
		lang = item?.['lang'];
		tags = item?.['tags'];
		author = item?.['author'];
		duration = item?.['duration'];
		out_pt = item?.['out_pt'];
		title = item?.['title'];
		if(!(title in this.songs))
			this.songs[title] = [];
	
		Object.keys(this.TAGS).forEach(TAG => {
			if(this.TAGS[TAG].includes(title))
				tags.unshift(TAG);			
		});
		if(tags.includes('follow')){
			item = this.songs[title].pop();
			item['duration'] += duration;
			item['length'] = Utils.sec2str(Math.round(item['duration']));
			item['tags'] = item['tags'].concat(tags.filter(x => x != 'follow'));
			item['tags'] = item['tags'].filter((tag, i) => item['tags'].indexOf(tag) == i);
			item['tag'] = item['tags'].join(' ').toLowerCase();
			item['next'] = {
				'href': href,
				'out_pt': out_pt
			};
			this.songs[title].push(item);
			return;
		}
		let title_chs;
		if((this.songs_info?.[title] ?? []).length == 1)
			title_chs = this.songs_info[title][0]?.['chs'];
		if(!(singer && lang) && title in this.songs_info){
			if(this.songs_info[title].length == 1){
				singer = singer ?? this.songs_info[title][0]['singer'];
				lang = lang ?? this.songs_info[title][0]['lang'];
			}else{
				singer = 'TBD.';
				lang = 'TBD.';
			}
		}
		let tag = tags.join(' ').toLowerCase();
		let is_song = true;
		is_song &= !RegExp('舞|cos展示').test(tag);
		is_song &= !RegExp('\\+').test(title);
		let gap = this.ms_now - Date.parse(Utils.pretty_date(date) + ' 00:00');
		gap = gap / 365 / 24 / 60 / 60 / 1000;
		let percent = 1 - Math.min(6, gap) / 6 * (1 - 0.15);

		this.songs[title].push({
			'title': title_chs ? `${title.toLowerCase()}|${title_chs.toLowerCase()}` : title.toLowerCase(),
			'title_raw': title,
			'title_chs': title_chs,
			'date': '▶ ' + Utils.pretty_date(date),
			'href': href,
			'href_raw': href_raw,
			'length': length,
			'duration': duration,
			'singer': singer,
			'lang': lang,
			'tags': tags,
			'tag': tag,
			'author': author,
			'is_clip': true,
			'is_song': is_song,
			'gap': gap.toString(),
			'percent': percent,
			'out_pt': out_pt ?? duration
		});
	}
	sort_songs(){
		this.ordered_songs.clear();
		Object.keys(this.songs)
		.sort((x1, x2) => x1.localeCompare(x2, 'zh-Hans-CN'))
		.forEach(title => {
			this.ordered_songs[title] = this.songs[title].sort((x1, x2) => -x1['date'].localeCompare(x2['date'], 'zh-Hans-CN'));
		});
		Object.keys(this.ordered_songs).forEach(title => {
			this.ordered_songs[title].forEach((item, idx) => {
				this.ordered_songs[title][idx]['mingap'] = this.ordered_songs[title][0]['gap'];
				this.ordered_songs[title][idx]['totalnum'] = this.ordered_songs[title].length;
			})
		})
		this.songs = {};
	}
	get uncollected_songs(){
		let uncollected_songs = [];
		Object.keys(this.songs_info).forEach(title => {
			if(!this.ordered_songs.has(title))
				uncollected_songs.push(title);
		})
		return uncollected_songs.sort((x1, x2) => x1.localeCompare(x2, 'zh-Hans-CN'));
	}
}


class NewWindow{
	constructor(){
		this.play_foreground = Utils.get_storage('play_foreground') == 'true' ? true : false;
		this.window = null;
		this.timeout_close = null;
	}
	get isAvailable(){
		return this.window && !this.window.closed;
	}
	close(force_close=false){
		if(this.isAvailable && (force_close || this.play_foreground)){
			this.window.close();
			this.window = null;
			clearTimeout(this.timeout_close);
			this.timeout_close = null;
			document.title = 'Makuri';
		}
	}
	get open(){
		return this.play_foreground ? this.open_url : this.change_url;
	}
	change_url(url, duration=null, is_cycle=false, is_seperate=false, title=null){
		if(!this.isAvailable){
			this.open_url(url, duration, is_cycle, is_seperate);
			return;
		}
		if(this?.timeout_close){
			clearTimeout(this.timeout_close);
			this.timeout_close = null;
		}
		this.window.location.href = url;

		if(!is_cycle && duration){
			this.timeout_close = setTimeout(() => {
				this.close(true);
			}, (parseFloat(duration) + 1.5 + (is_seperate ? 0.5 : 0)) * 1000);
		}
	}
	open_url(url, duration=null, is_cycle=false, is_seperate=false, title=null){
		if(this?.timeout_close){
			clearTimeout(this.timeout_close);
			this.timeout_close = null;
		}
		this.close();
		this.window = window.open(url);
		duration = parseFloat(duration);
		if(!is_cycle && duration){
			this.timeout_close = setTimeout(() => {
				this.close(true);
			}, (parseFloat(duration) + 1.5 + (is_seperate ? 0.5 : 0)) * 1000);
		}
	}
	set_foreground(flag){
		if(flag == this.play_foreground)
			return;
		this.play_foreground = flag;
		Utils.set_storage('play_foreground', flag);
	}
}


class VirtualList{
	constructor(new_win){
		// this.height_visible = 550 / 15;
		// this.height_vl = 10000 / 15;
		// this.num_rows = 20;
		this.px_item = 25;
		this.px_padding = 3;
		this.px_border = 2;

		this.get_rem2px_rate();
		this.height_visible = 550 / this.rem2px_rate;
		this.height_vl = 10000 / this.rem2px_rate;
		this.num_rows = 20;
		this.rem_item = 25 / this.rem2px_rate;
		this.rem_padding = 3 / this.rem2px_rate;
		this.rem_border = 0.125;

		this.new_win = new_win;
		this.btn_cycle = null;

		this.init_container();
	}
	init_container(){
		const div_cnts = Utils.create('div', ['div_cnts'], {});
		const intro_container = document.querySelector('#intro_container')
		if(intro_container)
			intro_container.insertAdjacentElement('afterend', div_cnts);
		else
			document.querySelector('#intro_container, h1').insertAdjacentElement('afterend', div_cnts);
		const cnt_songs = Utils.create('div', ['cnt_songs'], {});
		cnt_songs.innerText = '已收录歌曲 {0} 首';
		cnt_songs.setAttribute('data-text', cnt_songs.innerText);
		div_cnts.appendChild(cnt_songs);
		const cnt_clips = Utils.create('div', ['cnt_clips'], {});
		cnt_clips.innerText = '已收录切片 {0} 枚';
		cnt_clips.setAttribute('data-text', cnt_clips.innerText);
		div_cnts.appendChild(cnt_clips);
		this.cnt_songs = cnt_songs;

		const div_container_wrapper = Utils.create('div', [], {'id': 'vl_container_wrapper'});
		document.body.appendChild(div_container_wrapper);;


		const div_headers = Utils.create('div', [], {'id': 'vl_headers'});
		div_headers.style.height = '1.5rem';
		div_container_wrapper.appendChild(div_headers);

		const headers = [
			['title', 'Title'], 
			['date', 'Date'],
			['length', 'Dur.'],
			['singer', 'O.S.'],
			['lang', 'Lang.'],
			['tags', 'Tags']
		];
		headers.forEach(item => {
			const ele = Utils.create('div', [`header_${item[0]}`], {});
			ele.innerText = item[1];
			div_headers.appendChild(ele);
		})

		const div_container = Utils.create('div', [], {'id': 'vl_container'});
		div_container.style.overflowY = 'auto';
		div_container.style.overflowX = 'hidden';
		div_container_wrapper.appendChild(div_container);
		window.addEventListener('resize', (e)=>{
			this.update_visible_height();
		})

		const vl = Utils.create('div', [], {'id': 'vl'});
		vl.style.height = `${this.height_vl}rem`;
		div_container.appendChild(vl);

		const vl_rows = Utils.create('div', [], {'id': 'vl_rows'});
		vl.appendChild(vl_rows);
		
		this.div_container_wrapper = div_container_wrapper
		this.div_container = div_container;
		this.vl = vl;
		this.vl_rows = vl_rows;

		window.addEventListener('wheel', (e)=>{
			e.stopPropagation()
			this.div_container.scrollBy(0, e.deltaY );
		});
		this.init_touch();

		this.add_styles();
		this.clipboard = new ClipBoard();

		this.cnt_clips = cnt_clips;

		let rect = div_container_wrapper.getClientRects()[0];
		this.height_visible = (window.innerHeight - rect.y) * 0.95 / this.rem2px_rate;
		div_container_wrapper.style.height = `${this.height_visible}rem`;
		div_container.style.height = `${this.height_visible}rem`;


		this.div_container.addEventListener('scroll', (e) => {
			let pos = e.target.scrollTop / this.rem2px_rate;
			const start = pos == 0 ? 0 : this.bisect_left(this.positions, pos) + 1;
			this.vl_start = start
			let end;
			if (start == 0)
				end = this.bisect_right(this.positions, this.height_visible - this.rem_item);
			else
				end = this.bisect_right(this.positions, this.positions[start] + this.height_visible - this.rem_item - this.rem_border) - 1;

			this.render_visible_rows(start, end);
		})
		this.div_container.addEventListener('click', (e)=>{
			if(e.target.tagName == 'DIV' && e.target.classList.contains('group_title')){
				this.clipboard.copy(e.target.getAttribute('data-titleRaw'));
				return;
			}
			if(e.target.tagName == 'A' && e.target.classList.contains('info_link')){
				e.preventDefault();
				if(this.btn_cycle && this.btn_cycle.classList.contains('btn_active')){
					this.btn_cycle.setAttribute('close_win', this.new_win.play_foreground);
					this.btn_cycle.click();
					this.btn_cycle.removeAttribute('close_win');
				}
				let link = e.target;
				document.title = `『${link.getAttribute('data-titleRaw')}』`;
				this.new_win.open(
					link.getAttribute('data-href'),
					link.getAttribute('data-duration'),
					false,
					link.getAttribute('data-isSeperate'),
					link.getAttribute('data-titleRaw')
				);
				return;
			}
		})
	}
	init_touch(){
		this.cur_ele = null;
		this.last_timestamp = performance.now();
		const func_touchstart = (e)=>{
			// if(e.target != document.body && e.target.tagName != 'svg' && e.target.getAttribute('id') != 'vl')
			// 	return;
			if(this?.touch_dragging === true)
				return;

			this.touch_start_y = e.touches[0].clientY;
			this.start_scroll_top = this.div_container.scrollTop;
			this.last_scroll_up = this.div_container.scrollTop;
			this.velocity = 0;
			if(this?.animation_frame){
				cancelAnimationFrame(this.animation_frame);
				this.animation_frame = null;
			}
			this.touch_dragging = true;
		};
		const func_touchmove = (e)=>{
			if(!this?.touch_dragging)
				return;
			if(this?.start_scroll_top === null || this?.touch_start_y === null)
				return;
			if(['group_title', 'info_date', 'info_link', 'info_length', 'info_singer', 'info_lang', 'info_tag', 'info_tags'].some(x => e.target.classList.contains(x)))
				this.cur_ele = e.target;
			const y = e.touches[0].clientY;
			const delta_y = y - this.touch_start_y;
			// console.log((this.touch_start_y - y) * 5)
			if(this.start_scroll_top - delta_y < 0 || this.start_scroll_top - delta_y > (this.height - this.height_visible) * this.rem2px_rate){
				this.cur_ele = null;
				return;
			}

			this.div_container.scroll(0, this.start_scroll_top - delta_y);
			const now = performance.now();
			const delta_time = now - this.last_timestamp;
			if(delta_time > 0){
				this.velocity = (this.div_container.scrollTop - this.last_scroll_up) / delta_time;
				// console.log(this.velocity);
				this.last_scroll_up = this.div_container.scrollTop;
				this.last_timestamp = now;
			}
			// 连续滑动小trick
			if(delta_y != 0 && this.cur_ele && !this.cur_ele.classList.contains('temp_hidden')){
				this.cur_ele.style.display = 'hidden';
				this.cur_ele.classList.add('temp_hidden');
				document.body.appendChild(this.cur_ele);
			}		
		};
		const func_touchend = (e)=>{
			if(!this?.touch_dragging)
				return;
			this.touch_dragging = false;
			this.start_scroll_top = null;
			this.touch_start_y = null;
			this?.cur_ele?.remove();
			this.cur_ele = null;

			console.log(this.velocity);
			if(Math.abs(this.velocity) < 0.1)
				return;
			const start_time = performance.now();
			let start_scroll_top = this.div_container.scrollTop;
			const start_velocity = this.velocity * 100;
			const animate_scroll = (timestamp) => {
				const elapsed = timestamp - start_time;
				const decay = Math.exp(-elapsed / 325);
				const scroll_delta = start_velocity * decay;
				const new_scroll_top = start_scroll_top + scroll_delta;
				// console.log(scroll_delta, new_scroll_top);
				start_scroll_top = new_scroll_top;
				if(new_scroll_top < 0 || new_scroll_top > this.vl.scrollHeight || decay < 0.01 || Math.abs(scroll_delta) < 5){
					this.div_container.scroll(0, new_scroll_top);
					return;
				}
				this.div_container.scroll(0, new_scroll_top);
				this.animation_frame = requestAnimationFrame(animate_scroll);
			}
			this.animation_frame = requestAnimationFrame(animate_scroll);
		};
		window.addEventListener('touchstart', func_touchstart);
		window.addEventListener('touchmove', func_touchmove, {passive:true});
		window.addEventListener('touchend', func_touchend);
		window.addEventListener('touchcancel', func_touchend);
	}
	add_styles(){
		Utils.add_styles([
			'body{margin:0; padding:0; overflow:hidden;}',
			'#vl_container_wrapper{display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(180deg, transparent, rgb(255 255 255 / 80%) 1.5rem, transparent); width:62rem; max-width:92vw; margin:auto; z-index:10; position:relative;}',
			'#vl_headers{display:flex; flex-direction:row; font-weight:bolder; width:60rem; max-width:90vw; text-align:center; transform:translateX(-0.6rem);}',
			'.header_title{width:35%;}',
			'.header_date{width:13%;}',
			'.header_length{width:6.5%;}',
			'.header_singer{width:13%;}',
			'.header_lang{width:6.5%;}',
			'.header_tags{width:26%;}',
			'#vl{display:flex; justify-content:center;}',
			'#vl_rows{position:absolute; width:60rem; max-width:90vw;}',
			'#vl_container{width:62rem; max-width:92vw;}',

			'.group_rows{display:flex; width:100%; align-items:center; border-top:0.125rem solid black;}',
			'.group_rows:last-child{border-bottom:0.125rem solid black;}',
			'.group_title{width:35%; color:deeppink; cursor:pointer; user-select:none; align-items:center; display:flex; height:100%; min-width:fit-content;}',
			'.group_title:hover{font-weight:bolder;}',
			'.group_infos{display:flex; flex-direction:column; width:65%; text-align:center;}',
			`.row_infos{display:flex; flex-direction:row; align-items:center; height:${this.rem_item}rem; filter:opacity(var(--percent))}`,
			'.row_infos:has(.info_date:hover){filter:none;}',
			'.row_infos:has(.highlighted){filter:none;}',
			'.info_date{width:20%; user-select:none; min-width:fit-content;}',
			'.info_date:hover{font-weight:bolder;}',
			'.info_link{text-decoration:none; color:brown; cursor:pointer}',
			'.info_length{width:10%; color:green; min-width:fit-content;}',
			'.info_singer{width:20%; color:orange; min-width:fit-content;}',
			'.info_lang{width:10%; color:grey; min-width:fit-content;}',
			'.info_tags{width:40%; display:flex; justify-content:Wflex-start;}',
			'.info_tag{margin:0px 0.125rem; padding:0px 0.125rem; border:0.125rem dashed gray; border-radius:40% 0%; background:lightyellow; color:blue; min-width:fit-content;}',
			'span.info_author{min-width:4rem;}',
			'span.真栗{color:chocolate;text-shadow:0 0 0.125rem orange}',
			'span.录播组{color:NavajoWhite;background:gray}',
			'span.薯片水獭{color:Turquoise;background:gray}',
			'span.希望小紫真栗永远健康{background-image:linear-gradient(to right, #c99a8b, #9276a3); color:BlanchedAlmond; border-color:BlueViolet;}',
			'span.蝴蝶谷逸{color:lightyellow;background:darkgray}',
			'span.Monedula{color:AliceBlue;background:darkgray}',
			'span.麻糕{background:linear-gradient(180deg,skyblue,snow); color:#423e3d; text-shadow:0 0 0.2rem pink;}',
			'span.橙光游戏{color:orangered; text-shadow:0 0 2px green}',
			'span.BAN{color:red; font-weight:bold; text-decoration:line-through;}',
			'span.cos{color:gold; font-weight:bold; text-shadow:0 0 0.3rem #533806; background:#819cea;}',
			'span.面白い{color:purple; font-weight:bold;}',
			'span.儿歌{color:green}',
			'span.Monedula{color:AliceBlue;background:darkgray}',

			'.div_cnts{display:flex; justify-content:center; align-items:center; flex-direction:column; user-select:none;}',
			'.cnt_songs, .cnt_clips{color:DeepSkyBlue; font-weight:bolder; font-size:1.2rem; text-shadow:0 0 6px DarkTurquoise, 0 0 2px purple; margin:0.2rem 1.5rem; text-shadow:none; -webkit-text-stroke:0.15rem #00dfc89c; position:relative;}',
			'.cnt_songs::after, .cnt_clips::after{content:attr(data-text);position:absolute; left:0; top:0; -webkit-text-stroke:initial;}'
		]);
	}
	update_visible_height(){
		let rect = this.div_container_wrapper.getClientRects()[0];
		this.height_visible = (window.innerHeight - rect.y) * 0.95 / this.rem2px_rate;
		this.div_container.style.height = `${this.height_visible}rem`;
		this.div_container_wrapper.style.height = `${this.height_visible}rem`;
		// console.log(this.height_visible);
		this.get_rem2px_rate();
		this.init(this?.vl_start ?? 0);
	}
	px2rem(px){
		if(!this.rem2px_rate)
			this.rem2px_rate = this.get_rem2px_rate();
		return px / this.rem2px_rate;
	}
	get_rem2px_rate(){
		const div = Utils.create('div', [], {});
		div.style.height = '1rem';
		document.body.appendChild(div);
		let res = window.getComputedStyle(div)['height'];
		this.rem2px_rate = parseFloat(res.substring(0, res.length - 2));
		// console.log(this.rem2px_rate)
		document.body.removeChild(div);
	}
	load_songs(songs){
		this.songs = songs;
		this.get_positions();

		const cnt_songs = Array.from(this.songs.keys())
		.filter(title => this.songs[title].some(item => item['is_song']))
		.length;
		this.cnt_songs.innerText = `已收录歌曲 ${cnt_songs} 首`;
		this.cnt_songs.setAttribute('data-text', this.cnt_songs.innerText);
		let cnt_clips = Array.from(this.songs.values())
		.map(items => items.length)
		.reduce((sum, val) => {
			return sum + val;
		}, 0);
		this.cnt_clips.innerText = `已收录切片 ${cnt_clips} 枚`;
		this.cnt_clips.setAttribute('data-text', this.cnt_clips.innerText);
	}
	get_positions(){
		this.positions = [];
		this.clips_arr = [];
		this.songs_dic = new Map();
		this.get_rem2px_rate();

		let cur = 0;
		Array.from(this.songs.keys()).forEach(title => {
			this.songs_dic.set(title, cur);
			cur += this.px_padding + this.px_border;
			this.songs[title].forEach((item, idx) => {
				this.clips_arr.push(item);
				cur += this.px_item;
				if(idx == this.songs[title].length - 1)
					cur += this.px_padding;
				this.positions.push(cur / this.rem2px_rate);
			});
		})
		this.height = (cur + this.px_border) / this.rem2px_rate;
		this.positions.push(this.height);
		this.vl.style.height = `${this.height}rem`;
		// console.log(this.positions);
		// console.log(this.clips_arr);
		// console.log(this.songs_dic);

	}
	bisect_left(arr, val){
		let left = 0, right = arr.length, mid;
		while(left < right){
			mid = left + ((right - left) >> 1);
			if(arr[mid] >= val)
				right = mid;
			else
				left = mid + 1;
		}
		return left;
	}
	bisect_right(arr, val){
		let left = 0, right = arr.length, mid;
		while(left<right){
			mid = left + ((right - left) >> 1);
			if(arr[mid] <= val)
				left = mid + 1;
			else
				right = mid;
		}
		return left;
	}
	render_visible_rows(start, end){
		const fragment = document.createDocumentFragment();
		let prev_title = null;
		let group_rows, group_title, group_infos, row_infos;
		let info_date, info_link, info_length, info_singer, info_lang, info_tags, span;
		// console.log(this.clips_arr.slice(start, end))
		this.clips_arr.slice(start, end).forEach(song => {
			let title, date, href, length, duration, singer, lang, author, tags, is_seperate, percent;
			title = song?.['title'];
			date = song?.['date'];
			href = song?.['href'];
			length = song?.['length'];
			duration = song?.['duration'];
			singer = song?.['singer'] ?? '--';
			lang = song?.['lang'] ?? '--';
			author = song?.['author'];
			tags = song?.['tags'];
			is_seperate = song?.['is_seperate'];
			percent = song?.['percent'] ?? 1;

			let title_raw, title_chs;
			title_raw = song?.['title_raw'];
			title_chs = song?.['title_chs'];
			if(prev_title == null || prev_title != title_raw){
				prev_title = title_raw;
				group_rows = Utils.create('div', ['group_rows'], {});
				group_rows.setAttribute('data-height', this.rem_padding * 2 + this.rem_item);
				group_rows.style.height = `${group_rows.getAttribute('data-height')}rem`;
				fragment.appendChild(group_rows);

				group_title = Utils.create('div', ['group_title'], {
					'data-titleRaw': title_raw,
					'data-titleChs': title_chs,
					'title': title_raw
				});
				if(title_raw === this?.highlighted_title){
					group_title.classList.add('highlighted');
					this.highlighted_song = group_title;
				}
				group_title.innerText = Utils.pretty_str(title_raw);
				if(title_chs){
					group_title.onmouseover = (e)=>{
						e.target.innerText = Utils.pretty_str(e.target.getAttribute('data-titleChs'));
						e.target.style.color = 'DodgerBlue';
					};
					group_title.onmouseout = (e)=>{
						e.target.innerText = Utils.pretty_str(e.target.getAttribute('data-titleRaw'));
						e.target.style.color = 'deeppink';
					};
				}
				group_rows.appendChild(group_title);

				group_infos = Utils.create('div', ['group_infos'], {});
				group_rows.appendChild(group_infos);
			}
			else{
				group_rows.setAttribute('data-height', parseFloat(group_rows.getAttribute('data-height')) + this.rem_item);
				group_rows.style.height = `${group_rows.getAttribute('data-height')}rem`;
			}

			row_infos = Utils.create('div', ['row_infos'], {});
			row_infos.style.setProperty('--percent', percent);
			group_infos.appendChild(row_infos);

			// date+link
			info_date = Utils.create('div', ['info_date'], {});
			row_infos.append(info_date);
			info_link = Utils.create('a', ['info_link'], {
				'data-href': href,
				'data-titleRaw': title_raw,
				'data-titleChs': title_chs,
				'data-duration': duration,
				'data-isSeperate': is_seperate
			});
			if(song === this?.highlighted_link){
				info_link.classList.add('highlighted');
				this.highlighted_clip = info_link;
			}
			info_link.innerText = date;
			info_date.append(info_link);
			// length
			info_length = Utils.create('div', ['info_length'], {});
			info_length.innerText = length;
			row_infos.append(info_length);
			// singer
			info_singer = Utils.create('div', ['info_singer'], {'title': singer});
			info_singer.innerText = Utils.pretty_str(singer, 10);;
			row_infos.append(info_singer);
			// lang
			info_lang = Utils.create('div', ['info_lang'], {});
			info_lang.innerText = lang;
			row_infos.append(info_lang);
			// tags
			info_tags = Utils.create('div', ['info_tags'], {});
			span = Utils.create('span', ['info_author', 'info_tag', author], {'title': author});
			span.innerText = Utils.pretty_str(author, 6);;
			info_tags.appendChild(span);
			tags.forEach(tag => {
				span = Utils.create('span', ['info_tag', tag], {});
				span.innerText = tag;
				info_tags.appendChild(span);
			});
			row_infos.append(info_tags);
		});
		this.vl_rows.innerHTML = '';
		this.vl_rows.appendChild(fragment);
	}
	init(start=0){
		let end;
		if(start == 0)
			end = this.bisect_right(this.positions, this.height_visible - this.rem_item);
		else
			end = this.bisect_right(this.positions, this.positions[start] + this.height_visible - this.rem_item) - 1;
		this.render_visible_rows(start, end);
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
			'#div_rt{position:fixed; top:-0.8rem; right:-29px; display: flex; flex-direction: column; scale:0.9}',
			'#div_rt a{margin:0.13rem; display:flex; flex-direction: row; align-items: center; transition: transform 0.5s ease; z-index:100}',
			'#div_rt a img{border-radius:14px; background:white}',
			'#div_rt a .div_dec{width:24px; height:19px; display:block; transform: translateX(-4px); z-index:-1;}',
			'#div_rt a:hover {transform: translateX(-20px);}',
			'.div_dec{border-top: 6px double white; border-bottom: 6px double white; filter: hue-rotate(15deg);}'
		]);
		let div_rt = Utils.create('div', [], {'id': 'div_rt'});
		div_rt.addEventListener('click', (e)=>{
			if(e.target.tagName == 'A'){
				e.preventDefault();
				window.open(e.target.href);
			}
			if(e.target.tagName == 'IMG' || e.target.classList.contains('div_dec')){
				e.preventDefault();
				window.open(e.target.parentNode.href);
			}
		});
		document.body.appendChild(div_rt);
		this.data.forEach(item => {

			let link = Utils.create('a', [], {
				'title': '真栗栗的' + item['name'] + '主页',
				'href': item['href']
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
				'style': `background: ${item['color']};`
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


class Cursor{
	constructor(){
		this.init();
		const path = this.get_path();
		// this.points = this.load_points(path);
		// this.mount();
		this.fetch_points(path)
		.then(points => {
			this.points = points;
			this.mount();
		});
	}
	get_path(){
		let cursor_idx = Utils.get_storage('cursor_idx');
		if(!cursor_idx || cursor_idx === 'NaN'){
			this.cursor_idx = null;
			return './assets/jsons/points.json';
		}
		this.cursor_idx = parseInt(cursor_idx);
		return `./assets/jsons/points${cursor_idx}.json`;
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
	fetch_points(path){
		return fetch(path)
		.then(response => {
			if(!response.ok)
				throw Error(`${path} Error`);
			return response.json();
		})
		.catch(error => console.error(error));
	}
	init(){
		Utils.add_styles([
			'#cursor{position:fixed; top:0; left:0; pointer-events:none; z-index:10}',
			'#cursor .point{position:absolute; top:0; left:-0.5rem; width:0.235rem; height:0.235rem; border-radius:45%; }',
			'#cursor .point.disappear{animation: disappear 1s linear forwards}'
		])		
		this.cursor = Utils.create('div', [], {'id': 'cursor'});
		document.body.appendChild(this.cursor);

	}
	mount(){
		let cursor = this.cursor;
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
		// let move_points = Utils.debounce(((e) => {	
		// 	gsap.to('.point', {
		// 		x: e.clientX,
		// 		y: e.clientY,
		// 		ease: 'back.out(1.2)',
		// 		stagger:0.0015
		// 	});
		// }).bind(this), 1);
		this.func_move_points = (e) => {
			this.tween = gsap.to('.point', {
				x: e.clientX,
				y: e.clientY,
				ease: 'back.out(1.2)',
				stagger:0.0015
			});			
		}
		window.addEventListener('mousemove', this.func_move_points);
	}
	clear(){
		this.cursor.innerHTML = '';
		window.removeEventListener('mousemove', this.func_move_points);
	}
	update_points(path){
		this.clear();

		this.fetch_points(path)
		.then(points => {
			this.points = points;
			this.mount();
		})
	}
}


class Cursor2{
	constructor(){
		const path = this.get_path();
		let data = this.load_points(path);
		this.points = [];
		Object.keys(data)
		.sort((x1, x2) => parseInt(x2) - parseInt(x1))
		.forEach(idx => {
			this.points.push(data[idx]);
		});

		this.init_canvas();
	}
	get_path(){
		let cursor_idx = Utils.get_cookie('cursor_idx');
		if(!cursor_idx)
			return './assets/jsons/points.json';
		return `./assets/jsons/points${cursor_idx}.json`;		
	}
	load_points(path){
		let request = new XMLHttpRequest(path);
		request.open('GET', path, false);
		request.send(null);
		if (request.status == 404){
			return;
		}
		if (request.responseText.indexOf('<!DOCTYPE html>') != -1){
			return;
		}
		return JSON.parse(request.responseText);
	}

	init_canvas(){
		this.canvas = document.createElement('canvas');
		this.canvas.setAttribute('id', 'canvas_cursor');
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.canvas.style.width = 'auto';
		this.canvas.style.height = '100vh';
		this.canvas.style.position = 'fixed';
		this.canvas.style.left = '0px';
		this.canvas.style.top = '0px';
		document.body.appendChild(this.canvas);

		this.ctx = this.canvas.getContext('2d');
		this.ctx.shadowOffsetX = 0;
		this.ctx.shadowOffsetY = 0;
		this.ctx.shadowBlur = 8;
		this.radius = 2.2;
		this.points.forEach(point => {
			point['rgba'] = `rgba(${point['rgba'].join(',')})`
			this.ctx.fillStyle = point['rgba'];
			this.ctx.shadowColor = point['rgba'];
			this.ctx.beginPath();
			this.ctx.arc((1 + 2 * point['x']) * this.radius, (1 + 2 * point['y']) * this.radius, this.radius * 0.9 * point['scale'], 0, Math.PI * 2, true);
			this.ctx.closePath();
			this.ctx.fill();
			// this.ctx.fillRect((point['x']) * this.radius, (point['y']) * this.radius, this.radius*0.9, this.radius*0.9);
		});

		this.cnt = 0;
		this.times = Math.min(5, Math.max(1, Math.floor(500 / this.points.length)));
		this.xys = Array(this.points.length * this.times).fill([0, 0]);
		this.prev_update_time = performance.now();
		this.prev_render_time = performance.now();
		requestAnimationFrame(this.render.bind(this));

		this.prev_x = 0;
		this.prev_y = 0;
		window.addEventListener('mousemove', (e)=>{
			this.update_xys(e);
		})
	}

	update_xys(e){
		let now = performance.now();
		if (now - this.prev_update_time < 10) return;
		this.prev_update_time = now;

		this.xys.unshift([e.clientX, e.clientY]);
		for (let i = 0; i < this.times; i++){
			this.xys.unshift([
				this.prev_x + (e.clientX - this.prev_x) / this.times * (i + 1),
				this.prev_y + (e.clientY - this.prev_y) / this.times * (i + 1)
			])
		}
		this.prev_x = e.clientX;
		this.prev_y = e.clientY;
		this.cnt = this.points.length * this.times;
		while (this.xys.length > this.points.length * this.times){
			this.xys.pop();
		}
	}

	render(){
		if (this?.status_render == 'terminate'){
			this.status_render = 'finish';
			return;
		}
		if (this.cnt == 0) requestAnimationFrame(this.render.bind(this));

		let rect = this.canvas.getBoundingClientRect();
		let width = rect.width, height = rect.height;
		// console.log(width, height);
		this.ctx.clearRect(0, 0, width, height);
		let x, y;
		console.log(this.movements)
		this.points.forEach((point, idx) => {
			if (idx >= this.xys.length){
				x = 0;
				y = 0;
			} else {
				x = this.xys[idx][0] * (this.canvas.width / rect.width);
				y = this.xys[idx][1] * (this.canvas.height / rect.height);	
			}
			this.ctx.fillStyle = point['rgba'];
			this.ctx.shadowColor = point['rgba'];
			this.ctx.beginPath();
			this.ctx.arc((1 + 2 * point['x']) * this.radius + x, (1 + 2 * point['y']) * this.radius + y, this.radius * 0.9 * point['scale'], 0, Math.PI * 2, true);
			this.ctx.closePath();
			this.ctx.fill();
		});
		this.xys.unshift(this.xys[0]);
		this.cnt -= 1;
		requestAnimationFrame(this.render.bind(this));
	}
	update_points(path){
		this.clear();
		this.points = this.load_points(path);
		// console.log(this.points)
		this.status_render = 'terminate';
		const wait = ()=>{
			if(this.status_render != 'finish'){
				setTimeout(wait, 20);
			}
		};
		wait();
		
		requestAnimationFrame(this.render.bind(this));
	}
}


class SearchBox{
	constructor(vl, songs){
		this.songs = songs;
		sessionStorage.setItem('search_result', JSON.stringify(songs));
		this.vl = vl;
		this.cache_kv = new LRUCache(20);
		this.cache_search = new LRUCache(50);
		this.prev_values = null;

		this.inp_search = null;
		this.select_search = null;
		this.mount();
	}
	mount(){
		Utils.add_styles([
			'.div_search{display:flex; justify-content:center; z-index:10; position:relative;}',
			'.hidden{display:none}',
			'.input_search{min-width:15rem; margin:0 0.5rem;}',
			'#select_presets option{text-align:center}',
			'.div_search a{height:1.2rem; width:1.2rem; align-items:center; display:flex; justify-content:center; border-radius:50%; border:0.2rem solid grey; font-weight:500; color:grey; text-decoration:none; cursor:pointer; opacity:0.6; font-weight:bolder;}',
			'.div_search a:hover{opacity:1; border:0.2rem solid skyblue; color:skyblue;}',
			'#select_presets option{font-family:Arial,sans-serif; font-weight:500;}',
		]);
		let div_search = Utils.create('div', ['div_search'], {});
		document.querySelector('#vl_container_wrapper').insertAdjacentElement('beforebegin', div_search);

		let select = Utils.create('select', [], {'id':'select_presets'});
		let items = new Map([
			['🌟 ALL 🌟', ''],
			['⁺✞ʚ 🌰 ɞ✟₊', '-谭姐 -姨妈'],
			['最近 N 首', 'gap:<=32/365'],
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
			['英语 专场', 'lang:英语'],
			['粤语 专场', 'lang:粤语'],
			['👶儿歌👶 专场', 'tag:儿歌'],
			['❤️情人节❤️ 专场', 'date:05-20|02-14|03-14|24-08-10|23-08-22|21-08-14|20-08-25'],
			['🎀COS🎀 专场', 'tag:cos'],
			['🍺干杯🍺 专场', 'date:22-03-28|23-09-06|25-01-01|24-12-31'],
			['孤品 专场', 'totalNum:==1 -+ -（'], 
			['距最近收录已有1️⃣年', 'minGap:>=1 -+'],
			['距最近收录已有2️⃣年', 'minGap:>=2 -+'],
			['距最近收录已有3️⃣年', 'minGap:>=3 -+'],
			['距最近收录已有4️⃣年', 'minGap:>=4 -+'],
			['2021精选(蝴蝶谷逸_)', 'tag:2021精选'],
		]);
		Array.from(items.entries()).forEach((entry) => {
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
			if(this?.select_search) {
				this.select_search.value = e.target.value;
			}
			// this.search_timer(e);
			search_debounce(e);
		});
		inp.addEventListener('blur', (e)=>{
			if(this?.select_search)
				this.select_search.value = e.target.value;
			search_debounce(e);
		})
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
		let all_keys = ['title', 'date', 'tag', 'singer', 'lang', 'author', 'gap', 'mingap', 'totalnum'];

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
		return exprs.every(expr => {
			// console.log(expr)
			let keys, vals;
			[keys, vals] = [...this.get_keys_vals(expr)];
			// console.log(keys, vals)
			let is_dateRange = keys.length == 1 && keys[0] == 'date' ? true : false;
			let is_eval = keys.length == 1 && ['gap', 'mingap', 'totalnum'].includes(keys[0]) ? true : false;

			let attrs = keys.map(key => (item?.[key] ?? '').toString().toLowerCase());
			return vals.some(val => {
				if (is_dateRange && val.indexOf('~') != -1){
					let [start, end] = [...val.split('~').map(x => x.trim())];
					let _date = attrs[0].substring(4);
					return start.localeCompare(_date) == -1 && _date.localeCompare(end) == -1;
				}
				if (is_eval) {
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
		// console.log(this);
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
			this.vl.load_songs(this.songs);
			this.vl.init();
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
			}, new OrderedDict());
		} else {
			console.log(`[${values}] cached`);
		}
		
		if (e.target.value != values) {
			return;
		}
		// console.log(new_songs);
		sessionStorage.setItem('search_result', JSON.stringify(new_songs));
		this.vl.load_songs(new_songs);
		this.vl.init();
	}
}


class Drawers{
	constructor(new_win, vl){
		this.new_win = new_win;
		this.vl = vl;

		this.dur = null;
		this.timeout_highlight = null;
		this.timeout_cycle = null;
		this.INTERVAL_CLIPS = 1

		this.mount();
	}
	get song(){
		return this.vl.highlighted_song;
	}
	set song(val){
		this.vl.highlighted_song = val;
	}
	get clip(){
		return this.vl.highlighted_clip;
	}
	set clip(val){
		this.vl.highlighted_clip = val;
	}
	set_cursor(cursor){
		this.cursor = cursor;
		this.cursor_idx = Utils.get_storage('cursor_idx') ?? 2;
	}
	set_signature(signature){
		this.signature = signature;
	}
	get cursor_idx(){
		return this?.cursor?.cursor_idx;
	}
	set cursor_idx(val){
		if(this?.cursor)
			this.cursor.cursor_idx = val;
	}
	async draw_song(){
		if (this.song && this.timeout_highlight) {
			this.vl.highlighted_title = null;
			this.song.classList.remove('highlighted');
			this.song = null;
			clearTimeout(this.timeout_highlight);
			this.timeout_highlight = null;
		}
		const idx = Math.floor(Math.random() * this.vl.songs_dic.size);
		const title = Array.from(this.vl.songs_dic.keys())[idx];
		this.vl.highlighted_title = title;
		const start = this.vl.songs_dic.get(title);
		console.log(title);
		this.vl.div_container.scroll(0, start);
		await Utils.sleep(20);
		if(!this.song){
			this.song = document.querySelector(`.group_title[data-titleRaw="${title}"]`);
		}	
		this.song?.classList.add('highlighted');

		this.timeout_highlight = setTimeout(()=>{
			this.vl.highlighted_title = null;
			this.song?.classList.remove('highlighted');
			this.timeout_highlight = null;
			this.song = null;
		}, 5000);
	}
	async draw_clip(){
		if (this.clip && this.timeout_highlight) {
			this.vl.highlighted_link = null;
			this.clip.classList.remove('highlighted');
			this.clip = null;
			clearTimeout(this.timeout_highlight);
			this.timeout_highlight = null;
		}
		const idx = Math.floor(Math.random() * this.vl.clips_arr.length);
		const item = this.vl.clips_arr[idx];
		this.vl.highlighted_link = item;
		const start = idx === 0 ? 0 : this.vl.positions[idx - 1] * this.vl.rem2px_rate;
		console.log(item?.['title'], item?.['date']);
		this.vl.div_container.scroll(0, start);
		await Utils.sleep(20);

		if(!this.clip){
			this.clip = document.querySelector(`.info_link[data-href="${item?.['href']}"]`);
		}	
		this.clip?.classList.add('highlighted');

		this.timeout_highlight = setTimeout(() => {
			this.vl.highlighted_link = null;
			this.clip?.classList.remove('highlighted');
			this.clip = null;
			this.timeout_highlight = null;
		}, 5000);
	}
	async draw_clip_once(){
		if (this.clip && this.timeout_highlight) {
			this.vl.highlighted_link = null;
			this.clip.classList.remove('highlighted');
			this.clip = null;
			clearTimeout(this.timeout_highlight);
			this.timeout_highlight = null;
		}
		const idx = Math.floor(Math.random() * this.vl.clips_arr.length);
		const item = this.vl.clips_arr[idx];
		this.vl.highlighted_link = item;
		const start = idx === 0 ? 0 : this.vl.positions[idx - 1] * this.vl.rem2px_rate;
		console.log(item?.['title'], item?.['date'], start);
		this.vl.div_container.scroll(0, start);
		// console.log(this.clip);

		this.dur = parseFloat(item?.['duration']);
		let ms = (this.dur + this.INTERVAL_CLIPS) * 1000;
		ms += item?.['is_seperate'] === true ? 500 : 0;
		this.timeout_highlight = setTimeout(() => {	
			this.vl.highlighted_link = null;
			this.clip?.classList.remove('highlighted');
			this.clip = null;
			this.timeout_highlight = null;
		}, ms);
		document.title = '『' + item?.['title_raw'] + '』';
		this.new_win.open(item?.['href'], ms, true, item?.['title_raw']);

		await Utils.sleep(20);
		if(!this.clip){
			this.clip = document.querySelector(`.info_link[data-href="${item?.['href']}"]`);
		}	
		this.clip?.classList.add('highlighted');
		return ms;
	}
	draw_clip_cycle(){
		window.focus();
		if(this.vl.clips_arr.length == 0){
			window.alert('暂无切片');
			return false;
		}
		this.draw_clip_once()
		.then(ms => {
			this.timeout_cycle = setTimeout(()=>{
				this.new_win.close();
				this.draw_clip_cycle();
			}, ms);			
		})
		return true;
	}
	async draw_cursor(){
		if(!this?.cursor)
			return;
		const num = 7;
		console.log(this.cursor_idx);
		const idx = (this?.cursor_idx ?? 0 + 1) % num + 1;
		this.cursor_idx = idx;
		console.log(document.cookie);
		Utils.set_storage('cursor_idx', idx);
		console.log(document.cookie);
		this.cursor.update_points(`./assets/jsons/points${idx}.json`);
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
			'.highlighted{font-weight:bolder; animation:highlight 3s infinite; opacity:1;}',
			'@keyframes highlight{0%{color:red;} 14%{color:orange} 29%{color:yellow} 43%{color:green} 57%{color:cyan} 71%{color:blue} 86%{color:purple} 100%{color:red}}',

			'#div_btn_lb div{cursor:pointer; opacity:0.5; font-size:1rem; text-align:center;border:0px solid black;height:3rem; width:3rem; background:lightgrey; user-select:none; position:relative;}',
			'#div_btn_lb div:hover{opacity:1}',
			'#div_btn_lb{position:fixed; bottom:0.03rem; left:0; display:flex; flex-direction:column; z-index:10;}',
			'#div_btn_lb .btn_active{color:GoldenRod; opacity:1; font-weight:bolder; text-shadow:0 0 0.1rem brown;}',
			'#div_btn_lb #btn_drawClipCycle #btn_fbSwitch{z-index:10; border-radius:50%; height:1.5rem; width:1.5rem; padding:0; cursor:pointer; border-width:1px; text-align:center}',
			'#div_btn_lb #btn_drawClipCycle #btn_fbSwitch.btn_fore{background:white; color:black}',
			'#div_btn_lb #btn_drawClipCycle #btn_fbSwitch.btn_back{background:grey; color:white}',
			'.div_btn svg{position:absolute; top:0; left:0; width:3rem; height:3rem; pointer-events:none;}',
			'.div_btn svg rect{fill:none; width:3rem; height:3rem; stroke-width:4; stroke:DarkGoldenRod; stroke-dasharray:12rem; stroke-dashoffset:0; transition: stroke-dashoffset 2.5s ease;}',
			'.div_btn:hover svg rect{stroke-dasharray:12rem; stroke-dashoffset:24rem;}'
		]);

		//left-bottom
		let svg, rect;
		let div_lb = Utils.create('div', [], {'id': 'div_btn_lb'})
		document.body.appendChild(div_lb);

		let div, btn, div_text;

		div = Utils.create('div', ['div_btn'], {'id': 'btn_drawCursor'});
		div.addEventListener('click', () => {
			this.draw_cursor();
		});
		div_lb.appendChild(div);
		svg = Utils.create('svg', [], {});
		div.appendChild(svg);
		rect = Utils.create('rect', [], {});
		svg.appendChild(rect);
		div.innerHTML += '🖱<br />拖尾';

		div = Utils.create('div', ['div_btn'], {'id': 'btn_drawSong'});
		div.addEventListener('click', () => {
			this.draw_song();
		});
		div_lb.appendChild(div);
		svg = Utils.create('svg', [], {});
		div.appendChild(svg);
		rect = Utils.create('rect', [], {});
		svg.appendChild(rect);
		div.innerHTML += '♪<br />歌曲';


		div = Utils.create('div', ['div_btn'], {'id': 'btn_drawClip'});
		div.addEventListener('click', () => {
			this.draw_clip();
		});
		div_lb.appendChild(div);
		svg = Utils.create('svg', [], {});
		div.appendChild(svg);
		rect = Utils.create('rect', [], {});
		svg.appendChild(rect);
		div.innerHTML += '✄<br />切片';

		div = Utils.create('div', ['div_btn'], {'id': 'btn_drawClipCycle'});
		this.vl.btn_cycle = div;
		svg = Utils.create('svg', [], {});
		div.appendChild(svg);
		rect = Utils.create('rect', [], {});
		svg.appendChild(rect);
		btn = Utils.create('button', ['btn_fb_switch', this.new_win.play_foreground ? 'btn_fore' : 'btn_back'], {'id': 'btn_fbSwitch'});
		btn.innerText = this.new_win.play_foreground ? 'F' : 'B';
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
				if(this.draw_clip_cycle())
					e.target.classList.add('btn_active');
			}
		});
		div_lb.appendChild(div);

		div = Utils.create('div', ['div_btn'], {'id': 'btn_backToTop'});;
		svg = Utils.create('svg', [], {});
		div.appendChild(svg);
		rect = Utils.create('rect', [], {});
		svg.appendChild(rect);
		div.innerHTML += '▲<br />顶部';
		div.addEventListener('click', (e) => {
			let video = document.querySelector('video.video_snow');
			if (video && video.paused) {
				video.currentTime = 0;
				video.play();
			}
			this.vl.div_container.scroll(0, 0);

			// if(this?.signature){
			// 	this.signature.hidden();
			// 	this.signature.show();
			// }
		})
		div_lb.appendChild(div);
	}
}


class Introduction{
	constructor(){
		this.text = '完美女人·主机区歌姬·超A短发·栗门之主·36D欺诈者·腌入味的猩猩花栗鼠·全新原味36D酱的持有者·长腿美少女·身高193的修女·嘎蛋的猫咪·宝宝巴士·甜妹天花板·jio印写真制造者·世界上最可爱的口呆花·流芳百世的板栗烧鸡食谱·呆又呆十四年历史学家·百事可乐最坚定的支持者·栗门炸鸡掌控者·艾尔登传奇缔造者·不可置疑的街唱大师·嗦粉文化代言人·四国语言传承者·真栗栗不爱和你玩·主包唱歌有一手810975之歌姬·冬日限定这肩带可以限定皮肤·情人节的布莱克斯·这小妞挠的我心痒痒·八千的虔诚信徒·力挺好哥们·笑起来超甜·门牙不能住人·举栗人领袖·栗栗妹女士···';
		this.text = this.text.split('·').map(text => text === '' ? '' : `☞ ${text} ☜`);
		this.num_text = this.text.length;
		// console.log(this.num_text)
		this.add_styles();		

		const h1 = document.querySelector('h1');
		h1.style.cursor = 'pointer';
		h1.addEventListener('click', (e)=>{
			if(this?.div_container){
				Utils.set_storage('show_intro', false);
				this.clear();
			} else {
				Utils.set_storage('show_intro', true);
			}
				this.mount();
			this?.vl.update_visible_height();
		})
		this.mount(true);
	}
	set_vl(vl){
		this.vl = vl;
	}
	add_styles(){
		Utils.add_styles([
			'#intro_container{height:15rem; overflow:hidden;}',
			'#intro{display:flex; flex-direction:column; align-items:center; justify-content:flex-start;}',
			'#intro p{font-family:楷体; font-weight:bolder; color:Gold; text-shadow:0 0 15px orange, 0 0 5px black; transfrom:translateY(-16rem); height:1.2rem; margin:0.25rem; animation: appear 4.5s; user-select:none;}',
			'#intro p{transform:translateY(-3rem); height:0; margin:0; font-size:0;}',
			'@keyframes appear1{0%{transform:translateY(16rem);height:1.2rem; margin:0.25rem;} 50%{font-size:1.65rem;} 80%{transform:translateY(0);font-size:1.2rem; height:1.2rem;} 95%{transform:translateY(-3rem); height:0; font-size:0;}} 100%{transform:translateY(-3rem); height:0; margin:0; font-size:0;}}',
			// '@keyframes shadowToggle{0%{text-shadow: 0 0 5px orange, 0 0 3px black;} 50%{text-shadow: 0 0 30px orange, 0 0 5px black;} 100%{text-shadow: 0 0 5px orange, 0 0 3px black;}}'
		]);
	}
	clear(){
		if(this?.div_container){
			this.div_container.remove();
			this.div_container = null;
		}
		if(this?.interval){
			clearInterval(this.interval);
			this.interval = null;
		}
		if(this?.timeout){
			clearTimeout(this.timeout);
			this.timeout = null;
		}
	}
	mount(disappear=false){
		const show_intro = Utils.get_storage('show_intro') === 'false' ? false : true;
		if(show_intro){
			const div_container = Utils.create('div', [], {'id': 'intro_container'});
			document.body.querySelector('h1').insertAdjacentElement('afterend', div_container);
			const div_intro = Utils.create('div', [], {'id': 'intro'});
			div_container.appendChild(div_intro);
	
			let ps = [], p, idx = 0;
			const max_num = 9;
			let cnt = 0;
			this.interval = setInterval(() => {
				if(ps.length == max_num){
					p = ps.shift()
					div_intro.removeChild(p);
				}
				p = Utils.create('p', [], {'id': `intro_p_${cnt}`});
				p.innerText = this.text[idx];
				ps.push(p);
				idx = (idx + 1) % this.num_text;
				div_intro.appendChild(p);
				const timeline = gsap.timeline();
				timeline
				.to(`#intro_p_${cnt}`, {y: '16rem', height: '1.2rem', margin:'0.25rem', fontSize: '1.65rem', duration:0})
				.to(`#intro_p_${cnt}`, {y: 0, fontSize: '1.5rem', margin: '0.1rem', duration:3.8})
				.to(`#intro_p_${cnt}`, {y:'-3rem', height:0, fontSize:0, duration: 0.4, margin: 0})
				.to(`#intro_p_${cnt}`, {duration: 0.2,});
				
				cnt += 1;
			}, 500);			
			this.div_container = div_container;
		}

		if(!disappear)
			return;
		this.timeout = setTimeout(() => {
			this.clear();
			this?.vl.update_visible_height();
		}, 39.4 * 500);
	}
}


class Signature{
	constructor(){
		this.add_styles();
		this.init_svg();
		this.load_paths('./assets/jsons/paths.json')
		.then(paths => this.create_paths(paths))
	}
	load_paths(path){
		return fetch(path)
		.then(response => {
			if(!response.ok){
				throw Error(`${path} Error`);
			}
			return response.json();
		})
	}
	add_styles(){
		Utils.add_styles([
			'.path_show{stroke:#e25b1bba; stroke-width:6; stroke-dasharray:var(--length); stroke-dashoffset:var(--length); animation:stroke var(--duration) linear forwards; stroke-linecap:round; }',
			'@keyframes stroke{to{stroke-dashoffset: 0;}}',
			'#signature_svg{position:absolute; left:0; top:0; z-index:-1;}',
			'#signature_wrapper{position:fixed; left:2rem; top:19rem; height:9.9rem; width:13.1rem;}'
		]);
	}
	init_svg(){
		const wrapper = Utils.create('div', [], {'id': 'signature_wrapper'});
		document.body.appendChild(wrapper);

		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('id', 'signature_svg');
		svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
		svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		wrapper.appendChild(svg);
		const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
		svg.appendChild(defs);
		let gradient, stop;
		gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
		gradient.setAttribute('id', 'gradient');
		gradient.setAttribute('x1', '0%');
		gradient.setAttribute('y1', '0%');
		gradient.setAttribute('x2', '100%');
		gradient.setAttribute('y2', '0%');
		defs.appendChild(gradient);

		stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
		stop.setAttribute('offset', '0%');
		stop.setAttribute('stop-color', '#ead62cc4');
		gradient.appendChild(stop);
		stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
		stop.setAttribute('offset', '100%');
		stop.setAttribute('stop-color', '#fe9100ab');
		gradient.appendChild(stop);

		gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
		gradient.setAttribute('id', 'gradient_r');
		gradient.setAttribute('x1', '0%');
		gradient.setAttribute('y1', '0%');
		gradient.setAttribute('x2', '100%');
		gradient.setAttribute('y2', '0%');
		defs.appendChild(gradient);

		stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
		stop.setAttribute('offset', '0%');
		stop.setAttribute('stop-color', '#fe9100ab');
		gradient.appendChild(stop);
		stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
		stop.setAttribute('offset', '100%');
		stop.setAttribute('stop-color', '#ead62cc4');
		gradient.appendChild(stop);


		const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		// g.setAttribute('transform', 'translate(50,450) scale(1,-1)');
		g.style.transform = 'translate(0rem,100%) scale(1,-1)'
		g.setAttribute('fill', 'none');
		g.setAttribute('stroke', 'none');
		g.setAttribute('filter', 'blur(0.025rem)');

		// wrapper.addEventListener('click', async()=>{
		// 	await this.hidden();
		// 	await this.show();
		// })
		svg.appendChild(g);

		this.wrapper = wrapper;
		this.svg = svg;
		this.g = g;
	}
	create_paths(paths_data){
		let paths = [];
		paths_data.forEach(path_data => {
			const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			paths.push(path);
			// path.setAttribute('class', 'path_show');
			path.setAttribute('d', path_data);
			this.g.appendChild(path);
		});
		this.paths = paths
		this.show();
	}
	async show(){
		const paths = this.paths;
		const speed = 200;
		this.drawing = true;
		const draw = async(start, end, times, stroke='#000') => {
			let path, length;
			for(let idx = start; idx < end; idx++){
				if(this?.drawing === false)
					break
 				path = paths[idx];
 				length = Math.ceil(path.getTotalLength());
				path.style.setProperty('--length', length);
				path.style.setProperty('--duration', length / speed * times + 's');
				if(end - idx <= 3 && stroke == 'url(#gradient)')
					stroke = 'url(#gradient_r)'
				path.style.stroke = stroke;
				path.classList.add('path_show');
				await Utils.sleep((length / speed * times + 0.1) * 1000);
			}
		};
		// this.timeout = setTimeout(this.hidden.bind(this), 10 * 1000);
		await Promise.all([
			draw(0, 15, 1, '#e25b1bba'),
			draw(15, paths.length, 1.5, 'url(#gradient)')
		])
		this.drawing = false;
	}
	async hidden(){
		if(this?.drawing == true)
			return;
		this.drawing = false;
		if(this?.timeout){
			clearTimeout(this.timeout);
			this.timeout = null;
		}
		this.paths.forEach(path => {
			path.classList.remove('path_show');
			path.style.stroke = 'none';
		});
		await Utils.sleep(100)
	}
}


function main(){
	const introduction = new Introduction();
	const social_platforms = new SocialPlatforms();
	const img_rb = new Image_RB('./assets/imgs/sleep.webp');
	const new_win = new NewWindow();

	const TAGS = {
	"BAN": ['百万个吻', '骗赖', '你跟我比夹夹', '嘉宾', '香水有毒', '纤夫的爱', '天上掉下个猪八戒', '通天大道宽又阔', '大哥欢迎你', '好汉歌'],
	"面白い": ['百万个吻', '骗赖', '香水有毒', '通天大道宽又阔', '你跟我比夹夹', 'TMD我爱你', '闹啥子嘛闹', '810975', '忐忑', '蕉蕉'],
	"儿歌": ['小鲤鱼历险记', '我爱洗澡', '勇气大爆发', '我会自己上厕所', '加油鸭', '巴啦啦小魔仙', '小小鹿', '别看我是一只羊', '宝贝宝贝', '白龙马', '葫芦娃', '大家一起喜羊羊', '天上掉下个猪八戒', '快乐小孩', '少年英雄小哪吒', '我为厨艺狂', '永远的奥特曼']
	};
	console.time('LOAD JSON/CSV');
	const loader = new DataLoader(TAGS);
	const load_args = [
		['json2songs_timer', './assets/jsons/真栗.json', '真栗'],
		['json2songs_timer', './assets/jsons/麻糕Mago0.json', '麻糕'],
		['json2songs_timer', './assets/jsons/Monedula.json', 'Monedula'],
		['json2songs_timer', './assets/jsons/蝴蝶谷逸_.json', '蝴蝶谷逸'],
		['csv2songs_timer', './assets/csvs/薯片水獭.csv', '薯片水獭'],
		['csv2songs_timer', './assets/csvs/真栗栗录播组_Clean.csv', '录播组'],
		['csv2songs_timer', './真栗栗录播组_Selfuse.csv', '录播组'],
		['csv2songs_timer', './assets/csvs/希望小紫真栗永远健康.csv', '希望小紫真栗永远健康'],
		['json2songs_timer', './assets/jsons/橙光游戏.json', '橙光游戏'],
		['json2songs_timer', './南夕君cC.json', '南夕君cC']
	]
	// load_args.forEach(args => {
	// 	loader?.[args[0]](loader.load_data(args[1]) ?? '', video_author=args[2]);
	// });
	const data_processors = load_args.map(args => 
		loader.fetch_data(args[1])
		.then(data => {
			loader?.[args[0]](data ?? '', video_author=args[2]);
			console.log(loader.num_clips)
		})
		.catch(error => console.error(error))
	);
	Promise.all(data_processors)
	.then(() => {
		loader.sort_songs();
		console.log(Object.keys(loader.ordered_songs).length);
		// console.log(loader.ordered_songs);
		// console.log(`未收录(${loader.uncollected_songs.length})：\n`, loader.uncollected_songs.join('\n'));
		console.log(loader.num_songs, loader.num_clips)
		console.timeEnd('LOAD JSON/CSV');
	})
	.then(() => {		
		console.time('init virtual list');
		const vl = new VirtualList(new_win);
		vl.load_songs(loader.ordered_songs);
		vl.init();

		console.timeEnd('init virtual list');
		introduction.set_vl(vl);

		const search_box = new SearchBox(vl, loader.ordered_songs);
		const drawers = new Drawers(new_win, vl);
		return drawers;
	})
	.then((drawers) => {
		const cursor = new Cursor();
		drawers.set_cursor(cursor);	

		const signature = new Signature();
		drawers.set_signature(signature);
	});
}
main();