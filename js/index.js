'use strict';

const getHoursAmountFrom = dateVal => {
  const date = new Date(dateVal);
  const now = new Date();
  return Math.floor((now - date) / 36e5);
};

const removeElemFromArray = (arr, elem) => {
  arr.splice(arr.findIndex(compElem => elem === compElem), 1);
};

const getActiveRadioInput = (name) => {
  const inputs = document.querySelectorAll('input[name=' + name + ']');
  if(inputs[0]) {
    const checkedInput = [].find.call(inputs, method => method.checked);
    return checkedInput || null;
  };
};

const capitalize = string => string[0].toUpperCase() + string.slice(1);

const ajaxQuery = (url, sucCallback) => {
  const xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function(){
    if(xhr.readyState == 4) {
      if(xhr.status == 200) {
        if(sucCallback) sucCallback(xhr.response);
      }
      else if(xhr.status == 404) throw Error('Error: cannot find required script!');
      else throw Error('Error: server response: '+ xhr.status);
    }      
  }

  xhr.open('GET', url, true);
  xhr.setRequestHeader('Content-type','application/x-www-form-urlencoded');
  xhr.send();
};

class Joke {
  constructor(data, liked = false) {
    this.node = this.generateJokeNode();
    this.elements = {};
    
    this.favList = {};
    this.favList.node = this.generateJokeNode();
    this.favList.elements = {};
    
    this.generateIdNode(data.id);
    this.generateLikeNode(liked);
    this.generateValueNode(data.value);
    this.generateUpdatedAtNode(data.updated_at);
    this.generateCategoryNode(data.categories[0]);
  }
  
  generateJokeNode() {
    const node = document.createElement('div');
    node.classList.add('joke');
    return node;
  }
  
  generateIdNode(value) {
    if(!value || !this.node || !this.favList.node) return;
    
    this.id = value;
    this.elements.idNode = document.createElement('div');
    this.elements.idNode.classList.add('id');
    this.elements.idNode.innerHTML = 'ID: <a href="https://api.chucknorris.io/jokes/' + value + '" target="_blank">' + value + '</a>';
    
    this.favList.elements.idNode = this.elements.idNode.cloneNode(true);
    
    this.node.appendChild(this.elements.idNode);
    this.favList.node.appendChild(this.favList.elements.idNode);
  }
  
  generateLikeNode(active) {
    if(!this.node || !this.favList.node) return;
    
    this.liked = !!active;
    
    this.elements.likeNode = document.createElement('div');
    this.elements.likeNode.classList.add('like');
    
    this.favList.elements.likeNode = this.elements.likeNode.cloneNode(true);
    
    this.elements.likeNode.addEventListener('click', this.toggleFavourite.bind(this));
    this.favList.elements.likeNode.addEventListener('click', this.toggleFavourite.bind(this));
    
    if(active) this.addToFavourite();
    
    this.node.appendChild(this.elements.likeNode);
    this.favList.node.appendChild(this.favList.elements.likeNode);
  }
  
  toggleFavourite() {
    this.liked ? this.removeFromFavourite() : this.addToFavourite();
  }
  
  addToFavourite() {
    favJokesList.add(this);
    
    this.liked = true;
    this.elements.likeNode.classList.add('active');
    this.favList.elements.likeNode.classList.add('active');
  }
  
  removeFromFavourite() {
    this.liked = false;
    this.elements.likeNode.classList.remove('active');
    
    this.favList.node.classList.add('slideRight');
    setTimeout(() => {
      this.favList.elements.likeNode.classList.remove('active');
      this.favList.node.classList.remove('slideRight');
      favJokesList.remove(this);
    }, 300);
  }
  
  generateCategoryNode(value) {
    if(!value || !this.node) return;
    
    this.category = value;
    this.elements.categoryNode = document.createElement('div');
    this.elements.categoryNode.classList.add('category');
    this.elements.categoryNode.textContent = value;
    
    this.node.appendChild(this.elements.categoryNode);
  }
  
  generateValueNode(value) {
    if(!value || !this.node || !this.favList.node) return;
    
    this.value = value;
    this.elements.valueNode = document.createElement('p');
    this.elements.valueNode.textContent = value;
    
    this.favList.elements.valueNode = this.elements.valueNode.cloneNode(true);
    
    this.node.appendChild(this.elements.valueNode);
    this.favList.node.appendChild(this.favList.elements.valueNode);
  }
  
  generateUpdatedAtNode(value) {
    if(!value || !this.node || !this.favList.node) return;
    
    this.updatedAt = value
    this.elements.updatedAtNode = document.createElement('div');
    this.elements.updatedAtNode.classList.add('lastUpdate');
    this.elements.updatedAtNode.textContent = 'Last update: ' + getHoursAmountFrom(value) + ' hours ago';
    
    this.node.appendChild(this.elements.updatedAtNode);
    
    this.favList.elements.updatedAtNode = this.elements.updatedAtNode.cloneNode(true);
    this.favList.node.appendChild(this.favList.elements.updatedAtNode);
  }
};

const jokesList = {
  node: document.querySelector('#main .jokesList'),
  jokes: [],
  add: joke => {
    jokesList.jokes.push(joke);
    jokesList.node.appendChild(joke.node);
  },
  remove: joke => {
    removeElemFromArray(jokesList.jokes, joke);
    joke.node.remove();
  },
  reset: () => {
    jokesList.node.innerHTML = '';
    jokesList.jokes = [];
  }
};

const favJokesList = {
  node: document.getElementById('sidebar'),
  jokes: [],
  add: joke => {
    favJokesList.jokes.push(joke);
    favJokesList.node.appendChild(joke.favList.node);
    favJokesList.save();
  },
  remove: joke => {
    removeElemFromArray(favJokesList.jokes, joke);
    joke.favList.node.remove();
    favJokesList.save();
  },
  findJokeById: id => {
    return favJokesList.jokes.find(joke => joke.id == id);
  },
  save: () => {
    localStorage.removeItem('favJokes');
    localStorage.setItem('favJokes', JSON.stringify(favJokesList.jokes.map(joke => joke.id)));
  }
};

const getJokeButton = {
  node: document.getElementById('getJoke'),
  alertNode: document.querySelector('#getJoke .alert'),
  loading: false,
  getActiveMethod: () => getActiveRadioInput('method').value,
  getActiveCategory: () => getActiveRadioInput('category').value,
  alert: text => getJokeButton.alertNode.textContent = text,
  setLoadingStatus: () => {
    getJokeButton.loading = true;
    getJokeButton.node.classList.add('loading');
  },
  resetLoadingStatus: () => {
    getJokeButton.loading = false;
    getJokeButton.node.classList.remove('loading');
  },
  random: () => {
    if(getJokeButton.loading) return;
    
    getJokeButton.setLoadingStatus();
    ajaxQuery('https://api.chucknorris.io/jokes/random', (res) => {
      const jokeData = JSON.parse(res);
      let joke = favJokesList.findJokeById(jokeData.id);
      if(!joke) joke = new Joke(jokeData);
      jokesList.add(joke);
      getJokeButton.resetLoadingStatus();
    });
  },
  fromCategory: () => {
    if(getJokeButton.loading) return;
    
    const category = getJokeButton.getActiveCategory();
    
    getJokeButton.setLoadingStatus();
    ajaxQuery('https://api.chucknorris.io/jokes/random?category=' + category, (res) => {
      const jokeData = JSON.parse(res);
      let joke = favJokesList.findJokeById(jokeData.id);
      if(!joke) joke = new Joke(jokeData);
      jokesList.add(joke);
      getJokeButton.resetLoadingStatus();
    });
  },
  searchField: document.getElementById('query'),
  search: () => {
    if(getJokeButton.loading) return;
    
    if(!getJokeButton.searchField.value) {
      getJokeButton.alert('Enter the part of joke');
      return;
    };
    
    getJokeButton.setLoadingStatus();
    ajaxQuery('https://api.chucknorris.io/jokes/search?query=' + getJokeButton.searchField.value, (res) => {
      const jokesData = JSON.parse(res).result;
      if(jokesData[0])
        jokesData.forEach(jokeData => {
          let joke = favJokesList.findJokeById(jokeData.id);
          if(!joke) joke = new Joke(jokeData);
          jokesList.add(joke);
        });
      else
        getJokeButton.alert('No results for "' + getJokeButton.searchField.value + '"');
      getJokeButton.resetLoadingStatus();
    });
  },
  init: () => {
    const showJokes = () => {
      jokesList.reset();
      getJokeButton.alert('');
      
      switch(getJokeButton.getActiveMethod()) {
        case 'random': getJokeButton.random(); break;
        case 'category': getJokeButton.fromCategory(); break;
        case 'search': getJokeButton.search();
      };
    };
    
    getJokeButton.node.addEventListener('click', showJokes);
    getJokeButton.searchField.addEventListener('keyup', function(e) {
      if(e.keyCode === 13) showJokes();
    });
    
    const methodInputs = document.querySelectorAll('input[name=method]');
    [].forEach.call(methodInputs, method => {
      method.addEventListener('click', () => {
        getJokeButton.alert('');
        if(method.value != 'search') getJokeButton.searchField.value = '';
      });
    });
  }
};

const categoriesList = document.querySelector('#methods .categories');
ajaxQuery('https://api.chucknorris.io/jokes/categories', (res) => {
  const categories = JSON.parse(res);
  [].forEach.call(categories, (categoryName, i) => {
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'category';
    input.id = 'category' + (i+1);
    input.value = categoryName;
    if(!i) input.checked = true;
    categoriesList.appendChild(input);
    
    const label = document.createElement('label');
    label.setAttribute('for', 'category' + (i+1));
    label.classList.add('category');
    label.textContent = capitalize(categoryName);
    categoriesList.appendChild(label);
  });
});

const sidebarTitle = document.getElementById('sidebarTitle');
sidebarTitle.onclick = () => {
  if(window.offsetWidth > 1240) return;
  favJokesList.node.classList.toggle('active');
};

const blackBG = document.getElementById('blackBG');
blackBG.onclick = () => {
  if(window.offsetWidth > 1240) return;
  favJokesList.node.classList.remove('active');
};

const loadJokesFromLocalStorage = () => {
  const jokesId = JSON.parse(localStorage.getItem('favJokes'));
  localStorage.removeItem('favJokes');
  if(jokesId)
    jokesId.forEach(jokeId => ajaxQuery('https://api.chucknorris.io/jokes/' + jokeId, (res) => new Joke(JSON.parse(res), true)));
};

getJokeButton.init();
loadJokesFromLocalStorage();