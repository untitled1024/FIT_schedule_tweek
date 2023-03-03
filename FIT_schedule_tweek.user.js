// ==UserScript==
// @name         FIT schedule tweek
// @version      0.1
// @description  A few tweaks to the FIT schedule.
// @author       Ostap Lysov
// @match        *://docs.google.com/spreadsheets/d/e/2PACX-1vR9UNwnnWm92VpobftEDRy4c6xS9SkP0xHbVVUANMW3JVsd_0-rmwSNElXa1uTBbyteC3JmALRGyz8b/*
// @icon         http://www.gstatic.com/docs/spreadsheets/favicon3.ico
// @grant        none
// @require http://code.jquery.com/jquery-latest.min.js
// @require https://code.jquery.com/ui/1.13.2/jquery-ui.min.js
// ==/UserScript==

const COLOUR_DEFAULT = "Black";
const COLOUR_HIGHLIGHTED_1 = "MediumSeaGreen";
const COLOUR_HIGHLIGHTED_2 = "OrangeRed";
const COLOUR_FADED = "Gray";
const UNWRAP_RANGES = false;
const UNWRAP_FORTNIGHTLY_RANGES = false;
const today = new Date();
today.setHours(0,0,0,0);
const year = today.getFullYear();

(function() {
  'use strict';
  console.log(today);
  $('head').append('<link rel="stylesheet" type="text/css" href="//code.jquery.com/ui/1.13.2/themes/smoothness/jquery-ui.css">');
  $('td').each(function() {
    let isHighlighted_1 = false;
    let isHighlighted_2 = false;
    const orig = $(this).text().match(/\[[\d\.,\-\s]*\]/);
    const isFortnightly = $(this).text().includes("ч/т");
    if(!orig) return;
    const dates = [];
    orig[0].replace(/[^\d\-\.,]/g, '').split(',').forEach(element => {
      if(element.includes('-')){
        dates.push(parseDateRange(element));
      }else{
        dates.push(parseDate(element));
      }
    });
    let [newStr, tooltips] = format(colorize(dates, isFortnightly));
    let newHtml = $(this).html().replace(orig[0], newStr);
    $(this).html(newHtml);
    tooltips.forEach(element => {
      if(element[1]){
        let range = $(this).find('font:contains("' + element[1] + '")');
        range.attr('title', '');
        range.tooltip({
          content: element[0],
          classes: {
            "ui-tooltip": "highlight"
          }
        });
      }
    });
  });
  function parseDate(str){
    let strNums = str.split('.');
    return new Date(year, strNums[1] - 1, strNums[0]);
  }

  function parseDateRange(str){
    let strDates = str.split('-');
    return [parseDate(strDates[0]), parseDate(strDates[1])];
  }

  function getDiffDays(date){
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.abs(diffDays);
  }

  function colorize(dates, isFortnightly){
    const period = 7 + isFortnightly * 7;
    return dates.map(element => {
      if(Array.isArray(element)){
        let unwrappedDates = [];
        for(let date = new Date(element[0]); date<=element[1]; date.setDate(date.getDate() + period)){
          unwrappedDates.push(new Date(date));
        }
        unwrappedDates = colorize(unwrappedDates);
        if(UNWRAP_RANGES && !isFortnightly || UNWRAP_FORTNIGHTLY_RANGES && isFortnightly){
          return unwrappedDates;
        }else{
          let range_colour = COLOUR_DEFAULT;
          const diff = getDiffDays(element[0]);
          if(element[1] < today){
            range_colour = COLOUR_FADED;         // already passed
          }else if(element[0] > today){
            range_colour = COLOUR_DEFAULT;       // yet to come
          }else if(diff % period == 0){
            range_colour = COLOUR_HIGHLIGHTED_2; // today
          }else if(!isFortnightly && diff % period < 7 || isFortnightly && diff % period > 7){
            range_colour = COLOUR_HIGHLIGHTED_1; // in a week
          }
          return [[element, range_colour, unwrappedDates]];
        }
      }else{
        let color = COLOUR_DEFAULT;
        const diff = getDiffDays(element);
        if(element < today){
          color = COLOUR_FADED;         // already passed
        }else if(diff <= 1){
          color = COLOUR_HIGHLIGHTED_2; // today
        }else if(diff < 7){
          color = COLOUR_HIGHLIGHTED_1; // in a week
        }
      return [[element, color]];
      }
    }).flat();
  }

  function format(colorized){
    let newStr = "[";
    let tooltips = [];
    colorized.forEach(element => {
      if(!Array.isArray(element)) return;
      let content = dateToString(element[0]);
      let str = "<font style=\"color:" + element[1] + "\">" + content + "</font>";
      if(element.length == 3){
        tooltips.push([format(element[2])[0], content]);
      }
       newStr += str + ", ";
    });
    newStr = newStr.replace(/([,\s]+$)/g, '') + ']';
    return [newStr, tooltips];
  }
  
  function dateToString(date){
    if(Array.isArray(date)){
      return dateToString(date[0]) + '-' + dateToString(date[1]);
    }else{
      return ('0' + date.getDate()).slice(-2) + '.' + ('0' + (date.getMonth() + 1)).slice(-2);
    }
  }
})();