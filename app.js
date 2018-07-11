// BUDGETcontoroller
var budgetController = (function(){
    
    var Expense = function (id, description, value){
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };
    
    Expense.prototype.calculatePercentage = function(totalInc){
        if(totalInc > 0){
                this.percentage = Math.round(this.value/totalInc*100);
            } else {
                this.percentage = -1;
            }
    };
    
    Expense.prototype.getPercentage = function(){
        return this.percentage;
    };
    
    var Income = function (id, description, value){
        this.id = id;
        this.description = description;
        this.value = value;
    };
    
    var calculateTotal = function(type){
        var sum = 0;
        
        data.allItems[type].forEach(function(curr){
            sum = sum + curr.value;
        })
        data.totals[type] = sum;
    };

    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        
        totals: {
        exp: 0,
        inc: 0
        },
        
        budget: 0,
        percentage: -1
    };
    
    var saveData = function(data){
        localStorage.setItem('data', JSON.stringify(data));
    };
    
    var loadData = function(){
        if(localStorage.getItem('data')){
            data = JSON.parse(localStorage.getItem('data'));
        }
        // setting the prototype for every Expense since we need to call a particular method
        data.allItems.exp.forEach(function(current){
            Object.setPrototypeOf(current, Expense.prototype);
        });
        data.allItems.inc.forEach(function(current){
            Object.setPrototypeOf(current, Income.prototype);
        });
        // another option would be to store the parsed data in a different variable and iterate over it, step by step creation of new obcejts with constructor function new Expense, nes Income

    };
    
    var calculateBud = function(){
        // calculate total income and expenses
        calculateTotal('exp');
        calculateTotal('inc');
        // calculate the budget: income - expenses
        data.budget = data.totals.inc - data.totals.exp;
        // calculate the percentage of income we spent
        if(data.totals.inc > 0){
            data.percentage = Math.round(data.totals.exp / data.totals.inc *100);
        } else {
            data.percentage = -1;
        }
    };
    
    // returning OBJECT
    return {
        addItem: function(type, des, val){
            var newItem, ID;
            
            // create new ID
            if(data.allItems[type].length === 0){
                ID = 0;
            } else {
                ID = data.allItems[type][data.allItems[type].length-1].id + 1;
            }
            
            // create new item based on type 'exp' or 'inc
            if(type === 'exp'){
                newItem = new Expense(ID, des, val); // type iseither inc or exp
            } else if(type === 'inc'){
                newItem = new Income(ID, des, val); // type iseither inc or exp
            }
            
            // add the item to the underling data structure
            data.allItems[type].push(newItem);
            // return the item from the method
            calculateBud();
            saveData(data);
            return newItem;
        },
        
        calculateBudget: function(){
            calculateBud();
        },
        
        
        calculatePercentages: function(){
            // zero length check
            if(data.allItems.exp.length > 0){
               data.allItems.exp.forEach(function(current){
                    current.calculatePercentage(data.totals.inc);
            }); 
            } 
        },
        
        getPercentages: function(){
            /*
            var perc = data.allItems.exp.map(function(curr){
                return curr.percentage;
            });

            */
            var allPerc = data.allItems.exp.map(function(curr){
              return curr.getPercentage();
          });

            return allPerc;
        },
        
        deleteItem: function(type, id){
            var IDs, index;
            
            IDs = data.allItems[type].map(function(current){
                return current.id;
            });
            
            index = IDs.indexOf(parseFloat(id));

            if(index !== -1){
                data.allItems[type].splice(index, 1);
            };
            
            // SAVE FUNCTION CALL
            calculateBud();
            saveData(data);
        },
        
        getBudget: function(){
          return {
              budget: data.budget,
              totalInc: data.totals.inc,
              totalExp: data.totals.exp,
              percentage: data.percentage
          }  
        },
        
        getData: function(){
            return data
        },
        
        load: function(){
            calculateBud();
            loadData();
        },
        
        // might not be necessary
        save: function(){
            saveData(data);
        },
        
        testing: function(){
            calculateBud();
            saveData(data);
        }
    }
    
})();


// USER INTERFACE contoroller
var UIController = (function(){
    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expenseContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLablel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        monthLabel: '.budget__title--month'
    };
    
    var formatNumber = function(num, type){
            var numSplit, int, dec, sign, numString;
            
            num = Math.abs(num);
            
            
            // approach from the tutorial
            /*
            num = num.toFixed(2);
            
            numSplit = num.split('.');
            int = numSplit[0];
            
            if(int.length > 3){
                int = int.substr(0, int.length-3) + ',' + int.substr(int.length-3, 3);
            } // this works only for amount that is less than 1,000,000.00
        
            dec = numSplit[1];
            */

            // using number.toLocalStrring() method
            
            
            numString = num.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
            
            
            sign = type === 'exp' ? '-' :  '+';
            
            return sign + ' ' + numString;
          
    };
    
    var nodeForEach = function(list, callback){
        for(var i = 0; i < list.length; i++){
            callback(list[i], i);
        }
    };
    
    var addItem = function(obj, type){
        var html, newHtml, element;
        //create HTML string with placeholder text
        if(type === 'exp'){
             html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
                
             element = DOMstrings.expenseContainer;
        } else if(type === 'inc'){
            html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
                
            element = DOMstrings.incomeContainer;
        }
            
        // Peplace the placeholder text with real data
        newHtml = html.replace('%id%', obj.id).replace('%description%', obj.description).replace('%value%', formatNumber(obj.value, type));
        // newHtml = newHtml.replace('%description%', obj.description);
        // newHtml = newHtml.replace('%value%',obj.value);
            
        // insert the HTML into the DOM
        document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
    };
            
    
    // returning object, vhich will be stored in the UIController variable, properties accessible from ouside
    return {
        getInput: function(){
            
            return {
                type: document.querySelector(DOMstrings.inputType).value, // it will be either inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            };
            /*
            // income or expense
            var type = document.querySelector('.add__type').value; // it will be either inc or exp
            // description
            var description = document.querySelector('.add__description').value;
            // amount - number, parsing?
            var value = document.querySelector('.add__value').value;
            */
        },
        
        getDOMstrings: function(){
            return DOMstrings;
        },
        
        addListItem: function(obj, type){
            addItem(obj, type);
        },
        
        deleteItem: function(selectorID){
            document.getElementById(selectorID).remove();
            // approach from tutorial: element.parentNode.removeChild(element);
            
        },
        
        // cleaar function
        clearFields: function(){
            var fields, fieldsArray;
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
            
            fieldsArray = Array.prototype.slice.call(fields);
            
            fieldsArray.forEach(function(curr, index, array){
                curr.value = "";
            });
            
            fieldsArray[0].focus(); 
        },
        
        displayBudget: function(obj){
            var type;
            
            obj.budget >= 0 ? type = 'inc' : type = 'exp'; // we could also handle 0 in this case, respectively where the sign variable is handled in the format method
            
            // ui elements
            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLablel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');
            
            if(obj.percentage > 0){
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + ' %';
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';
            }
            
            
        },
        
        displayPercentages: function(percentages){
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel); // returns a NODElist
            
            nodeForEach(fields, function(current, index){
                if(percentages[index] > 0){
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '---';
                }
            });
        },
        
        displayMonth: function(){
            var now, month, year, months;
            
            now = new Date();
            // month = now.toLocaleString("en-us", {month: "long"});
            /*
                var formattedDate = new Date().toLocaleDateString('en-US', { month: 'long',year: 'numeric'});
            
            */
            month = now.getMonth();
            year = now.getFullYear();
            
            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            
            document.querySelector(DOMstrings.monthLabel).textContent = months[month] + ' '+ year;
            
        },
        
        changedType: function(){
            var fields;
            
            fields = document.querySelectorAll(DOMstrings.inputType + ', ' + DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
            
            // iterate through the collection and toggle the red-focus class
            nodeForEach(fields, function(curr){
                curr.classList.toggle('red-focus');
            });
            
            // toggle red class on the button
            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
            
            // red class for the button
            // red class:focus for other elements
            // button, inputDesc, inputValue
        },
        
        displayInit: function(dataStructure){
            dataStructure.allItems.exp.forEach(function(current){
                addItem(current, 'exp');
            });
            
            dataStructure.allItems.inc.forEach(function(current){
                addItem(current, 'inc');
            });
            
        }
    };
})();

// CONTROLLER 
var controller = (function(budgetCtrl, UICtrl){
    
    // called from within the init function
    var setUpEventListeners = function(){
        var DOM = UICtrl.getDOMstrings();
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);
        document.addEventListener('keydown', function(event){
            if(event.which === 13 || event.code === 'Enter'){
                ctrlAddItem();
            }
        });
        
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);
        
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
    };
    
   
    var updateBudget = function(){
        // 1. calculate Budget
        budgetCtrl.calculateBudget();
        // 2. return the budget
        var budget = budgetCtrl.getBudget();
        // 3. update UI 
        UICtrl.displayBudget(budget);
    };
    
    var updatePercentages = function(){
        // calculate percentages - only when an INCOME is added
        budgetCtrl.calculatePercentages();
        // read percentages from the budget controller
        var percentages = budgetCtrl.getPercentages();
        // update the UI with the percentages
        UICtrl.displayPercentages(percentages);
    }
    
    
    // custom function for handling of add button and enter key press event
    var ctrlAddItem = function(){
        var input, newItem;
        
        // 1. get the user input from the fields
        input = UICtrl.getInput();
        
        if(input.description !== '' && !isNaN(input.value) && input.value !== 0){
            // 2. add the items to the budgetController and its data structure
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);
            // 3. add the item to the UI
            UICtrl.addListItem(newItem, input.type);
            // 4. clear the input fields
            UICtrl.clearFields();
            // 5. calculate and update the budget
            updateBudget();
            // 6. update percentages
            updatePercentages();
        } 
    };
    
    var ctrlDeleteItem = function(event){
        var item, itemID, splitID, type, id;
        // different approach than in the tutorial
        
        // test whether the button was pressed
        if(event.target.classList.contains('ion-ios-close-outline')){
            item = event.target.closest('.item');
        
            if(item){
                itemID = item.id;
            }

            if(itemID){
                splitID = itemID.split('-');
                type = splitID[0];
                id = splitID[1];

                budgetCtrl.deleteItem(type, id);
                UICtrl.deleteItem(itemID);
                // recalculate
                updateBudget();
                if(type === 'inc'){
                    updatePercentages();
                }  
            }
        }
    };
    
    return {
        init: function(){
            // display the current month
            UICtrl.displayMonth();
            // set up the listeners
            setUpEventListeners();  
            // load data from local storage
            budgetCtrl.load();
            // update budget labels
            var budget = budgetCtrl.getBudget();
            UICtrl.displayBudget(budget);
            // display data loaded local storage
            UICtrl.displayInit(budgetCtrl.getData());
            // display the percentages
            updatePercentages();
        }
    };
   
    
})(budgetController, UIController);


controller.init();