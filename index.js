
document.addEventListener("alpine:init", () => {

    Alpine.data('pizzaCart', () => {
        return {
            header: "Perfect Pizza",
            title: "Shopping Cart",
            pizzas: [],
            //username: 'SPACE445',
            username: '',
            //cardId: 'KciWaNJnYw',
            cardId: '',
            cartPizzas : [],
            cartTotal: 0.00,
            paymentAmount: 0,
            message: '',
            featuredPizzas:[],
            historicalOrders: [],
            showHistoricalOrders: false,
            showHistoricalOrdersButton: false,

            login() {
                if(this.username.length > 3) {
                    localStorage['username'] = this.username;
                    this.clearUserData();
                    this.createCart();
                }
                else {
                    alert("Username is too short");
                }
            },

            logout() {
                if(confirm('Do you want to logout?')) {
                    this.username = '';
                    this.cardId = '';
                    localStorage['cardId'] = '';
                    localStorage['username'] = '';
                }
            },

            createCart() {
                if(!this.username) {
                    return Promise.resolve();
                }
                const cardId = localStorage['cardId'];

                if (cardId && localStorage['username'] === this.username) {
                    this.cardId = cardId;
                    return Promise.resolve();
                } else {
                    const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`
                    return axios.get(createCartURL)
                            .then(result => {
                                this.cardId = result.data.cart_code;
                                localStorage['cardId'] = this.cardId;
                            });
                }
            },

            featuredGet() {
                const featuredURL = `https://pizza-api.projectcodex.net/api/pizzas/featured?username=${this.username}`
                return axios.get(featuredURL); 
            },

            getCart() {
                const getCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/${this.cardId}/get`
                return axios.get(getCartURL)
            },

            showCartData() {
                this.getCart().then(result => {
                    const cartData = result.data;
                    this.cartPizzas = cartData.pizzas;
                    this.cartTotal = cartData.total.toFixed(2); 
                })
            },

            addPizza(pizzaId) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/add', {
                    "cart_code": this.cardId,
                    "pizza_id": pizzaId
                }).then(() => true).catch(err=>{
                    console.log(err);
                })
            },

            RemovePizza(pizzaId) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/remove', {
                    "cart_code": this.cardId,
                    "pizza_id": pizzaId
                })
            },

            pay(amount) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/pay', {
                    "cart_code" : this.cardId,
                    amount
                })
            },

            init() {

                const storedUsername = localStorage['username'];

                if(storedUsername) {
                    this.username = storedUsername;
                }
                
                axios
                    .get('https://pizza-api.projectcodex.net/api/pizzas')
                    .then(result => {
                        this.pizzas = result.data.pizzas
                });

                if(!this.cardId) {
                    this
                        .createCart()
                        .then(() => {
                            this.showCartData();
                        }
                    )
                    this.featuredGet().then(res=>{
                        console.log(res.data);
                        this.featuredPizzas = res.data.pizzas;
                        // this.showCartData();
                    })
                }
            },

            showFav() {
                this.featuredGet().then(res=>{
                    console.log(res.data);
                    this.featuredPizzas = res.data.pizzas;
                })
            },

            addfavorite(favPizzaId){
                return axios.post('https://pizza-api.projectcodex.net/api/pizzas/featured', {
                    "username": this.username,
                    "pizza_id" : favPizzaId
                }).then(()=>{
                    this.showFav();
                })
            },

            addPizzaToCart(pizzaId) {
                console.log('Adding pizza to cart:', pizzaId);
                this.addPizza(pizzaId)
                    .then(() => {
                        console.log('Pizza added, updating cart data...');
                        this.showCartData();
                    })
                    .then(() => {
                        console.log('Updated cartPizzas:', this.cartPizzas);
                        console.log('Updated cartTotal:', this.cartTotal);
                    })
                    .catch(error => {
                        console.error('Error in addPizzaToCart:', error);
                    });
            },

            removePizzaFromCart(pizzaId) {
                this.RemovePizza(pizzaId)
                    .then(() => {
                        this.showCartData();
                    }
                )
            },

            HistoricalCart() {
                let order = {
                    pizzas: [...this.cartPizzas.map(pizza => ({
                        flavour: pizza.flavour,
                        price: pizza.price,
                        qty: pizza.qty
                    }))],
                    total: parseFloat(this.cartTotal),
                    date: new Date().toLocaleDateString()
                };
                this.historicalOrders.push(order);
            },

            payForCart() {
                this.pay(this.paymentAmount)
                    .then(result => {
                        if (this.paymentAmount >= 0 && this.cartTotal === 0) {
                            this.message = "Your cart is cleared, check your receipt!";
                            setTimeout(() => this.message = '', 4000)
                        }

                        else if (result.data.status == 'failure' && this.paymentAmount > 0) {
                            this.message = result.data.message + " Sorry - that is not enough money!";
                            setTimeout(() => this.message = '', 4000)
                        }
                        
                        else if (result.data.status == "success" && this.paymentAmount > this.cartTotal) {
                            const change = this.paymentAmount - this.cartTotal;
                            this.message = `Payment received, but you have change of : R${change.toFixed(2)} Enjoy your Pizzas!`

                            this.HistoricalCart();

                            this.showHistoricalOrdersButton = true;

                            setTimeout(() => {
                                this.message = '';
                                this.cartPizzas = [];
                                this.cartTotal = 0.00;
                                //this.cardId = '';
                                this.paymentAmount = 0;
                                localStorage['cardId'] = '';
                                this.createCart();
                            }, 4000)

                        } else if(result.data.status == "success" && this.paymentAmount === this.cartTotal) {
                            this.message = 'Payment received, Enjoy your Pizzas!';
                            this.HistoricalCart();

                            // this.showCartDetails = true;
                            this.showHistoricalOrdersButton = true;
                            setTimeout(() => {
                                this.message = '';
                                this.cartPizzas = [];
                                this.cartTotal = 0.00;
                                //this.cardId = '';
                                this.paymentAmount = 0;
                                localStorage['cardId'] = '';
                                this.createCart();
                            }, 4000)

                        } else if ((result.data.status == 'failure' && this.paymentAmount === 0) || (result.data.status == 'failure' && this.paymentAmount === '') || (result.data.status == 'failure' && this.paymentAmount == 0)) {
                            this.message = "Sorry - you have to put amount to pay!";
                            setTimeout(() => this.message = '', 4000)
                        } else if(this.paymentAmount === 0) {
                            this.message = "Your cart is empty, add some items!";
                            setTimeout(() => this.message = '', 4000)
                        } else if (this.paymentAmount === '' && this.cartTotal == 0.00) {
                            this.message = "Your cart is empty, add some items!";
                            setTimeout(() => this.message = '', 4000)
                        } 
                    }
                )
            },

            toggleFavorite(id) {
                const pizza = this.pizzas.find(p => p.id === id);
                if (pizza) {
                    pizza.isFavorite = !pizza.isFavorite;
                }
            },

            toggleHistoricalOrders() {
                this.showHistoricalOrders = !this.showHistoricalOrders;
            },

            clearUserData() {
                this.historicalOrders = [];
                this.cartPizzas = [];
                this.cartTotal = 0.00;
                this.paymentAmount = 0;
                this.message = '';
                this.featuredPizzas = [];
                this.showHistoricalOrders = false;
                this.showHistoricalOrdersButton = false;
                this.cardId = '';
            }
        }
    })
})

