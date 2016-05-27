

isset = function (obj) {
    if (typeof obj != 'undefined')
        return true;
    return false;
}

exports.VsStat = function VsStat() {
    this.text = '';

    //Мусорные слова
    this.trashWord = ['a', 'the', 'i', 'we', 'they', 'he', 'she', 'us', 'them', 'it', 'aboard', 'about', 'above', 'across', 'after', 
    'against', 'along', 'amid', 'among', 'and', 'anti', 'around', 'as', 'at', 'before', 'behind', 'below', 'beneath', 'beside', 'besides',
     'between', 'beyond', 'but', 'by', 'concerning', 'considering', 'despite', 'down', 'during', 'except', 'excepting', 'excluding',
      'following', 'for', 'from', 'in', 'inside', 'into', 'like', 'minus', 'near', 'of', 'off', 'on', 'onto', 'opposite', 'outside', 
      'over', 'past', 'per', 'plus', 'regarding', 'round', 'save', 'since', 'than', 'through', 'to', 'toward', 'towards', 'under',
       'underneath', 'unlike', 'until', 'up', 'upon', 'versus', 'via', 'with', 'within', 'without', 'do', 'does', 'did', 'has', 
       'have', 'had', 'is', 'am', 'are', 'was', 'were', 'be', 'being', 'been', 'may', 'must', 'might', 'should', 'could',
        'would', 'shall', 'will', 'can', 'with', 'if',
    'а-ля', 'без', 'без ведома', 'безо', 'благодаря', 'близ', 'близко от', 'в', 'в виде', 'в зависимости от', 
    'в интересах', 'в качестве', 'в лице', 'в отличие от', 'в отношении', 'в пандан', 'в пользу', 'в преддверии', 'в продолжение',
     'в результате', 'в роли', 'в связи с', 'в силу', 'в случае', 'в соответствии с', 'в течение', 'в целях', 'вблизи', 'ввиду', 
     'вглубь', 'вдогон', 'вдоль', 'вдоль по', 'взамен', 'включая', 'вкруг', 'вместо', 'вне', 'внизу', 'внутри', 'внутрь', 'во', 
     'во имя', 'вовнутрь', 'возле', 'вокруг', 'вопреки', 'вослед', 'впереди', 'вплоть до', 'впредь до', 'вразрез', 'вроде', 'вслед',
      'вслед за', 'вследствие', 'для', 'для-ради', 'до', 'за', 'за вычетом', 'за исключением', 'за счёт', 'заместо', 'из', 'из-за', 
      'из-под', 'изнутри', 'изо', 'исключая', 'исходя из', 'к', 'касательно', 'ко', 'кроме', 'кругом', 'лицом к лицу с', 'меж', 
      'между', 'мимо', 'на', 'на благо', 'на виду у', 'на глазах у', 'на предмет', 'наверху', 'навроде', 'навстречу', 'над', 
      'надо', 'назад', 'назади', 'накануне', 'наместо', 'наперекор', 'наперерез', 'наподобие', 'напротив', 'наряду с', 
      'насупротив', 'насчёт', 'начиная с', 'не без', 'не в', 'не за', 'не считая', 'невзирая на', 'недалеко от', 'независимо от',
       'несмотря', 'несмотря на', 'ниже', 'о', 'об', 'обо', 'обок', 'около', 'окрест', 'окромя', 'округ', 'опосля', 'от', 
       'от имени', 'от лица', 'относительно', 'ото', 'перед', 'передо', 'по', 'по линии', 'по мере', 'по направлению к', 
       'по отношению к', 'по поводу', 'по причине', 'по случаю', 'по сравнению с', 'по-за', 'по-над', 'по-под', 'поблизости от',
        'поверх', 'под', 'под видом', 'под эгидой', 'подле', 'подо', 'подобно', 'позади', 'позднее', 'помимо', 'поперёд', 'поперёк',
         'порядка', 'посверху', 'посередине', 'посередь', 'после', 'посреди', 'посредине', 'посредством', 'пред', 'предо', 'прежде',
          'при', 'при помощи', 'применительно к', 'про', 'против', 'путём', 'ради', 'рядом с', 'с', 'с ведома', 'с помощью', 
          'с точки зрения', 'с целью', 'сверх', 'сверху', 'свыше', 'середь', 'сзади', 'сквозь', 'скрозь', 'следом за', 'смотря по', 
          'снизу', 'со', 'согласно', 'спустя', 'среди', 'средь', 'сродни', 'судя по', 'супротив', 'у', 'через', 'чрез', 'где', 
          'почему', 'бы', 'много','я', "было", 'наоборот', 'не','как','в','на','и','а','что','его','к','для','вы','это','с','0',
          'же','о','но','он','чтобы','все','если','за',
            'сб', 'очень','этом','так','однако','лучше','также','после','сразу', 'должен', 'быть', 'то','туда','просто','когда',
            'был', 'по', 'во', 'вс', 'во', 'году', 'года', 'при', 'уже', 'ни','до','только','никогда','а','м', 'от', 'у', 'ещ', 'е', 'или',
            'даже', 'того', 'могут', 'которые', 'может', 'поэтому', 'вашей', 'вероятно', 'важно', 'очень', 'том', 'снова', 'пока', 'чаще', 'еще', 'большое',
            'они', 'были', 'одном', 'об', 'из', 'ежегодном', 'говорится', 'между', 'замечены', 'деле', 'время', 'всего', 'ее', 'вошел' ];

    //Количество возвращаемых слов
    this.getCountFirstWord = 25;

    this.hashBaseWord = {'агрессии': 'агрессия'};
 
  
    function __construct() {
        
    }
    //@param array $params key => value
    this.init = function (params) {
        for (var key in params) {
            this[key] = params[key];
        }
    }

    //@param string $text
    this.setText = function (text) {
        this.text = text;
    }

    //@return string
    this.getText = function () {
        return this.text;
    }

    //@param string $word  @return boolean
    this.isTrash = function (word) {
       return (!word || !isNaN(word) || (this.trashWord.indexOf(word) != -1));
    }   

    this.strip_tags = function ( str ){ // Strip HTML and PHP tags from a string
        return str.replace(/<\/?[^>]+>/gi, '');
    }

    this.findByWord = function (arr, word) {
        for (var i in arr) {
            if (arr[i].word == word)
                return i;
        }
        return -1;
    }

    this.findNearWords = function(indx, resultReal, words, isIncrement) {

        var leftBuf = '', leftC = 0;
        var n = indx;
        while ((n > indx-3 && !isIncrement) || (n > indx+3 && isIncrement)) {
            if (isIncrement)
                n++;
            else
                n--;
            var left = isset(words[n]) ? words[n] : null; 
            if (!(left === null) && this.isTrash(left)) {
                leftBuf = left + ' ' + leftBuf;
                continue;
            }
            var wordIndex = this.findByWord(resultReal, left);
            if (wordIndex != -1) {
                leftC = Math.ceil(resultReal[wordIndex].count / 2); 
                leftBuf =  left + ' ' + leftBuf; 
                break;
            } 
            leftBuf = ''; 
            break; 
        };
        leftBuf = leftBuf.trim();
        return [leftBuf, leftC]
    }

    //@return VsWord[]
    this.getStat = function () {
        var text = this.getText();
        //text = text.replace("//iu", "", text);
        text = this.strip_tags(text);
        text = text.toLowerCase();
        text = text.replace(/[^a-zA-ZА-Яа-я0-9\s]/iug, " ", text);
        var words = text.split(/[\s]+/);

        var result = [];
        for (var idx in words) {
            var word = words[idx]
            if (this.isTrash(word)) {
                continue;
            } 
            word = this.getBaseWord(word); 
            var index = this.findByWord(result, word);
            if (index == -1) {
                result.push(new VsWord(word));
                index = result.length - 1;
            }

            result[index].count ++;
            result[index].indx.push(idx);
        } 
 
        result.sort(sortCount);
        //получаем первую выборку слов с высоким рейтингом 
        var resultReal = this.slice(result, this.getCountFirstWord * 2);

        /*for (var i = 0; i < Math.min(resultReal.length, 5); i++) {

            console.log('tmpword', resultReal[i].count,resultReal[i].word);
        }*/
        var resultMerge = [];
        //находим пары для самых частых слов
        //при желании можно огранить поиск для первых 3-5 слов
        for (var w in resultReal) {
            var obj = resultReal[w];
            for (var inx in obj.indx) {
                            //находим слова слева 
                var leftBuf, leftC, rightBuf, rightC;
                [leftBuf, leftC] = this.findNearWords(obj.indx[inx], resultReal, words, false);
                            //находим слова справа
                [rightBuf, rightC] = this.findNearWords(obj.indx[inx], resultReal, words, true);
                /*n = obj.indx[inx];
                var rightC = 0, rightBuf = '';
                while (n < obj.indx[inx] + 3) {
                    n++;
                    var right = isset(words[n]) ? words[n] : null; 
                    if (!(right === null) && this.isTrash(right)) {
                        rightBuf = rightBuf + ' ' + right;
                        continue;
                    }
                    var wordIndex = this.findByWord(resultReal, right);
                    if (wordIndex != -1) {
                        rightC = Math.ceil(resultReal[wordIndex].count / 2); 
                        rightBuf = rightBuf + ' ' + right;
                        break;
                    }  
                    rightBuf = ''; 
                    break; 
                }; 
                rightBuf = rightBuf.trim();*/

                if (rightBuf) { 
                    var word = (obj.word + ' ' + rightBuf).trim();  
                    var wordIndex = this.findByWord(resultMerge, word);
                    if (wordIndex == -1) {
                        resultMerge.push(new VsWord(word, obj.count + rightC));
                        wordIndex = resultMerge.length - 1;
                    }
                    resultMerge[wordIndex].count++; 
                }
                if (leftBuf) {
                    var word = (leftBuf + ' ' + obj.word).trim();   
                    var wordIndex = this.findByWord(resultMerge, word);  
                    if (wordIndex == -1) {
                        resultMerge.push(new VsWord(word, obj.count + leftC));
                        wordIndex = resultMerge.length - 1;
                    }
                    resultMerge[wordIndex].count++;
                }
                if (leftBuf && rightBuf) { 
                    var word = (leftBuf + ' ' + obj.word + ' ' + rightBuf).trim();    
                    var wordIndex = this.findByWord(resultMerge, word);
                    if (wordIndex == -1) {
                        resultMerge.push(new VsWord(word, obj.count + rightC + leftC));
                        wordIndex = resultMerge.length - 1;
                    }
                    resultMerge[wordIndex].count += 2; 
                }
                
            } 
        }

        for (var word in resultMerge) {
            resultReal.push(resultMerge[word]);
        }
    

        //второй раз осуществляем выборку
        resultReal.sort(sortCount);
        ///this.sort(resultReal); 
        return this.slice(resultReal, this.getCountFirstWord); 
    }

    this.getBaseWord = function(word) { 
        //adding new word in dictionary
        if (!isset(this.hashBaseWord[word])) { //!isset(this.hashBaseWord[word])
            this.hashBaseWord[word] = word;
        }

        return this.hashBaseWord[word];
    }


    this.slice = function(result, size) {
        return result.length > size ? result.slice(0, size) : result;
    }
    
    function sortCount (w1, w2) {
        return w1.count <  w2.count ? 1 : -1;
    };
}

/**
* Хранение информации о слове*/
function VsWord(word, count) {
    if (count == undefined)
        count = 0;
    this.word = word;
    this.count = count;
    //this.word = '';
    //this.count = 0;
    this.indx = []; 

    function __construct(word, count) {
        if (count == undefined)
            count = 0;
        this.word = word;
        this.count = count;
    }
}