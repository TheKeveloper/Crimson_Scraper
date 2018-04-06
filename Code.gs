function getRSSUrl(){
  return "http://www.thecrimson.com/feeds/section/news/"; 
}

function readRSS() {
  const item_regex = /<item>(.*?)<\/item>/;
  const tag_regex = /<a href="\/tag\/(.*?)">/;
}
