module.exports.arraySort = function (obj) { 
    // console.log(obj);
    var array=[]
      for(a in obj){
       array.push([a,obj[a]])
      }
      console.log(array)
      array.sort();
      return array
  };

module.exports.arrayDesort = function (obj) {
    // console.log(obj);

    var dict = {}

    for (i=0; i<obj.length; i++){
        dict[obj[i][0]] = obj[i][1]
    }

    return dict
}