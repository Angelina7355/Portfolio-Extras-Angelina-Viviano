// import './App.css'
// import { useEffect, useState } from 'react';

// function App() {
//   const [catFact, setCatFact] = useState("");
//   // triggers on component mount (when App() is rendered on the page.)
//   useEffect(() => {
//     const apiUrl = "https://catfact.ninja/fact" // CAT FACTS :)
//     fetch(apiUrl)
//     .then(res => res.json())
//     .then(resJson => {
//       //const firstFact = resJson[0]; // extract the first cat fact
//       //const firstFactText = firstFact.text; // get the text of the cat fact
//       //setCatFact(firstFactText); // set the cat fact for our use state hook
//       setCatFact(resJson.fact); // Access 'fact' directly
//     })
//     .catch(err => console.error(err))
//   }, []) // null dependency array

//   return (
//     <>
//       {catFact ? <h1>Cat Fact!! : {catFact}</h1> : <h1>Fetching Cat Fact...</h1>} 
//       {/* Conditionally render the cat fact based on whether or not it has been set yet */}
//     </>
//   )
// }

// export default App