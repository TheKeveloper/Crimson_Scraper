function getRSSUrl(){
  return "http://www.thecrimson.com/feeds/section/news/"; 
}

function getSpreadsheetUrl(){
  return "https://docs.google.com/spreadsheets/d/1gWAZjMHv9WCE-zqvuTcO9akwbGjgPpeRj0XlibspTs0/edit#gid=0";
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
  this.time = Utilities.formatDate(new Date(), "EST", "MM-dd-yyyy HH:mm:ss");
  this.authors = [];
  this.tags = [];
}

function rssToArray(item){
  return [item.time, item.date, item.link, item.title, item.authors.toString(), item.tags.toString(), item.description];
}

function strToArr(str, sep){
  return str.split(sep).filter(function(item, pos, self){return self.indexOf(item) == pos && item != ""});
}

function countOccurrences(arr){
  var dict = {};
  arr.forEach(function(elt){
    if (elt in dict){
      dict[elt]++;
    }
    else{
      dict[elt] = 1;
    }
  });
  
  var result = [];
  for(var key in dict){
    result.push([key, dict[key]]);
  }
  return [result, dict];
}

function scrape() {
  var spreadsheet = SpreadsheetApp.openByUrl(getSpreadsheetUrl());
  var sheet = spreadsheet.getSheets()[0];
  var values = sheet.getRange(2, 1, 1, 7).getValues()[0];
  var prevUrl = values[2];
  const item_regex = /<item>(.*?)<\/item>/g;
  const tag_regex = /<a href="\/tag\/(.*?)">/g;
  const author_regex = /\/writer\/\d+\/.*?\//g
  const rss = UrlFetchApp.fetch(getRSSUrl()).getContentText();
  const itemStrs = rss.match(item_regex);
  var authors = [];
  var tags = [];
  var rssItems = [];
  for(var i = 0; i < itemStrs.length; i++){
    var item = new RSSItem(itemStrs[i]);
    if(item.link == prevUrl){
      break;
    }
    var article = UrlFetchApp.fetch(item.link).getContentText();
    item.tags = article.match(tag_regex);
    for(var j = 0; j < item.tags.length; j++){
      item.tags[j] = item.tags[j].substring(14, item.tags[j].length - 2);
    }
    Logger.log(item.tags);
    item.authors = article.match(author_regex);
    if(item.authors != null){
      for(var j = 0; j < item.authors.length; j++){
        item.authors[j] = item.authors[j].substring(16, item.authors[j].length - 1).replace(/%20/g, "");
      }
    }
    else{
      item.authors = [];
    }
    authors = authors.concat(item.authors);
    tags = tags.concat(item.tags);
    rssItems.push(item);
  }
  var newRows = [];
  for(var i = 0; i < rssItems.length; i++){
    newRows.push(rssToArray(rssItems[i]));
  }
  if(newRows.length > 0){
    sheet.insertRowsAfter(1, newRows.length);
    sheet.getRange(2, 1, newRows.length, 7).setValues(newRows);
  }
  Logger.log(newRows);
  console.log("Added " + newRows.length + " new rows");
  Logger.log("Added " + newRows.length + " new rows");
  
  //Code for adding to aggregation
  var authorsCount = countOccurrences(authors)[1];
  var tagsCount = countOccurrences(tags)[1];
  
  var tagSheet = spreadsheet.getSheetByName("Tags");
  var authorsSheet = spreadsheet.getSheetByName("Authors");
  
  var tagRange = tagSheet.getRange("A:B")
  var tagValues = tagRange.getValues();
  for(var i = 1; i < tagValues.length; i++){
    var key = tagValues[i][0]
    if(key in tagsCount){
      tagValues[i][1] += tagsCount[key];
    }
  }
  var authorsRange = authorsSheet.getRange("A:B");
  var authorsValues = authorsRange.getValues();
  for(var i = 1; i < authorsValues.length; i++){
    var key = authorsValues[i][0];
    if(key in authorsCount){
      authorsValues[i][1] += authorsCount[key];
    }
  }
  
  tagRange.setValues(tagValues);
  authorsRange.setValues(authorsValues);
}

function getColumnStrings(sheet, strRange, sep){
  var values = sheet.getRange(strRange).getValues();
  //Remove column title
  values.splice(0, 1);
  var result = [];
  //Flatten array
  for(var i = 0; i < values.length; i++){
    //Split string to array, remove the duplicates, then concat
    result = result.concat(strToArr(values[i][0], sep));
  }
  return result;
}

function aggregateExisting(){
  var spreadsheet = SpreadsheetApp.openByUrl(getSpreadsheetUrl());
  var sheet = SpreadsheetApp.openByUrl(getSpreadsheetUrl()).getSheets()[0];
  var tags = getColumnStrings(sheet, "F:F", ",");
  var authors = getColumnStrings(sheet, "E:E", ",");
  var tagSheet = spreadsheet.getSheetByName("Tags");
  var tagCounts = countOccurrences(tags)[0];
  var authorCounts = countOccurrences(authors)[0];
  tagSheet.getRange(2, 1, tagCounts.length, 2).setValues(tagCounts);
  var authorSheet = spreadsheet.getSheetByName("Authors");
  authorSheet.getRange(2, 1, authorCounts.length, 2).setValues(authorCounts);
}
