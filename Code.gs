function getRSSUrl(){
  return "http://www.thecrimson.com/feeds/section/news/"; 
}

function getTagItem(item, tag){
  const regex = new RegExp("<" + tag + ">" + "(.*?)<\/" + tag + ">", "g");
  const result = item.match(regex);
  if(result.length > 0){
    return result[0].substring(tag.length + 2, result[0].length - tag.length - 3);
  }
  else{
    throw "No links in item!";
  }
}

function RSSItem(itemStr){
  const date_regex = /article\/\d+\/\d+\/\d+/;
  this.link = getTagItem(itemStr, "link");
  this.title = getTagItem(itemStr, "title");
  this.date = this.link.match(date_regex)[0].substring(8);
  this.description = getTagItem(itemStr, "description");
  this.authors = [];
  this.tags = [];
}

function readRSS() {
  const item_regex = /<item>(.*?)<\/item>/g;
  const tag_regex = /<a href="\/tag\/(.*?)">/g;
  const author_regex = /mailto:(.*?)@thecrimson/g
  const rss = UrlFetchApp.fetch(getRSSUrl()).getContentText();
  const itemStrs = rss.match(item_regex);
  var rssItems = [];
  for(var i = 0; i < itemStrs.length; i++){
    const item = new RSSItem(itemStrs[i]);
    const article = UrlFetchApp.fetch(item.link).getContentText();
    item.tags = article.match(tag_regex);
    for(var j = 0; j < item.tags.length; j++){
      item.tags[j] = item.tags[j].substring(14, item.tags[j].length - 2);
    }
    item.authors = article.match(author_regex);
    for(var j = 0; j < item.authors.length; j++){
      item.authors[j] = item.authors[j].substring(7, item.authors[j].length - 12); 
    }
    rssItems.push(item);
  }
  Logger.log(rssItems);
}
