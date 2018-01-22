const express = require('express'),
      ejs = require('ejs'),
      cors = require('cors'),
      bodyParser = require('body-parser'),
      axios = require('axios'),
      app = express(),
      port = 3005

app.use(bodyParser.json())
app.use(cors())


app.set('view engine', 'ejs')

//======== HELPER FUNCTIONS =========//
var got50Characters = 0
let characters = []

function getCharacter(url, callback){
    axios.get(url).then(data => {
        characters = [...characters, ...data.data.results]
        got50Characters += 1 //first goes on page 1, then 2, 3, 4, 5
        if(got50Characters < 5){
            getCharacter(data.data.next, callback)
        } else {
            callback()
        }
    })
}

function characterSort(sortTerm){
    characters.sort((a, b) => {
        if(sortTerm === 'mass'){
            let aMass, bMass
            if (a.mass === 'unknown'){
                aMass = 0
            } else {
                aMass = a.mass.split(',').join('') * 1  
            }
            if(b.mass === 'unknown') {
                bMass = 0
            } else {
                bMass = b.mass.split(',').join('') * 1  
            }
            if(aMass >= bMass){
                return 1
            } else {
                return -1
            }
        }

        if(sortTerm === 'height'){
            let aHeight, bHeight
            if (a.height === 'unknown'){
                aHeight = 0
            } else {
                aHeight = a.height.split(',').join('') * 1  
            }
            if(b.height === 'unknown') {
                bHeight = 0
            } else {
                bHeight = b.height.split(',').join('') * 1  
            }
            if(aHeight >= bHeight){
                return 1
            } else {
                return -1
            }
        }

        if (a[sortTerm] >= b[sortTerm]){
            return 1
        } else {
            return -1
        }
    })
}

var gotAllPlanets = false
let planets = {}
function getPlanets(url, callback){
    axios.get(url).then(data => {
        data.data.results.map(e => {
            planets[e.name] = e.residents
        })
        if(data.data.next){
            getPlanets(data.data.next, callback)
        } else {
            callback()
        }
    })
}

//=========== ENDPOINTS ===========//

//Basic Endpoint
app.get('/', (req, res) => {
    res.render('index.ejs');
})

//Character endpoint - Luke, Leia, Han, Rey
app.get('/character/:name', (req, res) => {
    //I have chosen to make this work for just the 4 characters 
    //specified. If I had not, I probably would have gotten all 
    //people, and checked each page for the matching name that 
    //is requested.
    //req.params.name
    let nameDict = {
        luke: 1,
        leia: 5,
        han: 14,
        rey: 85
    }
    axios.get(`https://swapi.co/api/people/${nameDict[req.params.name]}/`).then(data => {
        let {name, height, mass, gender, hair_color, skin_color, eye_color, birth_year} = data.data
        res.render('character.ejs', {
            name,
            height,
            mass,
            gender,
            hair_color,
            eye_color,
            skin_color,
            birth_year
        })
    })
})


//CHARACTERS endpoint - get 50.
app.get('/characters', (req, res) => {
    //NOTE: the SWAPI api already returns in groups 
    //of 10 per page, and doesn't have documentation
    //for limiting the pagination size, so I haven't 
    //done anything specific to get the api to limit 
    //itself to 10 characters per page - however, I 
    //imagine that if I needed to, I would add something 
    //along the lines of - 
    //'...baseurl.../characters/page=1&limit=10'.

    getCharacter('https://swapi.co/api/people/?page=1', () => {
        console.log('GO!')
        got50Characters = 5
    })

    if(got50Characters === 5){
        if(req.query.sort) {
            characterSort(req.query.sort)
        }
        res.status(200).send(characters)
    } else {
        setTimeout(() => {
            if(got50Characters === 5){
                if(req.query.sort) {
                    characterSort(req.query.sort)
                }
                res.status(200).send(characters)
            } else {
                res.status(404).send('Having trouble reaching the API - try again in a minute!')
            }
        }, 3000)
    }
})


//Planets endpoint - 61 in API

//This represents an attempt to make the code more flexible/DRY by making a recursive
//call within the Promise callback function, until resolve is called. Tt was working, 
//but, it was throwing an Unhandled Promise rejection error, so I decided to use the 
//code below instead, just for the sake of being error free.
// var planets = {}
// var planetPageIterator = 1
// function planetCallback(resolve, reject) {
//     axios.get(`https://swapi.co/api/planets/?page=${planetPageIterator}`).then(data => {
//         data.data.results.map(e => {
//             planets[e.name] = e.residents
//         })
//         if(Object.keys(planets) === data.data.count) {
//             resolve(planets)
//         } else {
//             planetPageIterator += 1
//             planetCallback(resolve, reject)
//         }
//     })
// }
// let gettingPlanets = new Promise(planetCallback)

app.get('/planetresidents', (req, res) => {
    
    getPlanets('https://swapi.co/api/planets/?page=1', () => {
        console.log('GO!')
        gotAllPlanets = true
    })

    if(gotAllPlanets){
        res.status(200).send(planets)
    } else {
        setTimeout(() => {
            if(gotAllPlanets){
                res.status(200).send(planets)
            } else {
                res.status(404).send("Having trouble reaching the API - try again in a minute!")
            }           
        }, 3500)
    }
    //From recursive attempt:
    // res.status(200).send(planets)
})


app.listen(port, () => console.log(`I'm listening on port ` + port))