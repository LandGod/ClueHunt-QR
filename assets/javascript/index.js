    // ___________________________________________________Algorithm _____________________________________________________________________//
    // 1) Basically the objective here is to pass user data -> via their special login code to link them to their 'current' clue page.

        // a) The user enters the data through the form.

        // b) The form takes the user input and saves it
            // i. At the same time -> upon the on-click event, the user will be re-directed to the page where the form is connected to. (In this case, it will be the Clue Page)

        // c) When the user is directed to the Clue Page, they will see the current clue, along with their code in local storage?

    // How will this be done?
    //1) The user will enter their personal code in the form.
    //2) Then the form-data is saved in localStorage ->
    //3) User will be redirected to new page. clue_page.html


    // Possible ideas for the method:
        // localStorage
        // take data from local storage -> render -> clear local storage

    // ___________________________________________________Program _____________________________________________________________________//


// On-click Functions:

// _______________Submit User Code -> Go To Clue Page_____________________//


//Create variable to grab content from URL
var grabString = location.search;
//Split the string after the '=' sign and contain new string in a variable
// console.log(grabString);
var temp = grabString.split("=");
//Decode the string into valid text for URL encoded characters
// console.log(temp);
var clueCode = decodeURI(temp[1]);


// When user enters input this code will be stored locally.
function store() {
// Declared a variable: codeVariable | where, the user inputs their data in the id, #codeForm, and will be transferred to localStorage.
var codeVariable = document.getElementById("codeForm");
// The setItem() method of the Storage interface, when passed a key name and value, will add that key to the given Storage object, or update that key's value if it already exists.
localStorage.setItem("code", codeVariable.value);

};

// After local storage has been saved -> redirect to clue_page.html
function clueFunction(){
window.open("clue_page.html", "_self");
};

// ____________________New Game_________________________//
// This line of code is the onclick function for the <New Game button> which will lead the user to: new_game.html
function newGame() {
    if (authentication.uID() !== null) {window.open("new_game.html");}
    else {window.open("login.html")};
    
};

// ____________________Login_________________________//

// This line of code is the onclick function for the <Login button> which will lead the user to: login.html
function login() {
    window.open("login.html")
};

if (clueCode) {
    $("#codeForm").val(clueCode.slice(1))
    if ($('#codeForm').val() == "ndefined") {$('#codeForm').val('')}
}





