// App - app object
App = {
    contracts: {},
    loading: false,
    load: async () => {
        console.log('App loading...');
        try {
            await App.loadWeb3();
            await App.loadAccount();
            await App.loadContract();
            await App.render();
            console.log('App loading complete!');
        } catch (error) {
            console.error('Error in load:', error);
            $('#loader').html(`
                <div class="text-center">
                    <i class="fas fa-exclamation-circle text-danger mb-3" style="font-size: 3rem;"></i>
                    <p class="text-danger">Error loading application. Please check if MetaMask is connected and you're on the correct network.</p>
                </div>
            `);
        }
    },

    loadWeb3: async () => {
        console.log('Loading Web3...');
        try {
            if (window.ethereum) {
                App.web3Provider = window.ethereum;
                web3 = new Web3(window.ethereum);
                // Request account access
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                console.log('MetaMask connected!');

                // Listen for account changes
                window.ethereum.on('accountsChanged', function (accounts) {
                    App.account = accounts[0];
                    App.render();
                });

                // Listen for network changes
                window.ethereum.on('chainChanged', function (networkId) {
                    window.location.reload();
                });
            } else if (window.web3) {
                App.web3Provider = window.web3.currentProvider;
                web3 = new Web3(window.web3.currentProvider);
                console.log('Legacy web3 detected!');
            } else {
                console.log('No Ethereum browser detected. Please install MetaMask!');
                throw new Error('No Ethereum browser detected');
            }
        } catch (error) {
            console.error("Error initializing Web3:", error);
            throw error;
        }
    },

    loadAccount: async () => {
        console.log('Loading account...');
        try {
            const accounts = await web3.eth.getAccounts();
            App.account = accounts[0];
            // Format the account address for display
            const shortAddress = App.account.slice(0, 6) + '...' + App.account.slice(-4);
            console.log("Account loaded:", shortAddress);
        } catch (error) {
            console.error("Error loading account:", error);
            throw error;
        }
    },

    loadContract: async() => {
        console.log('Loading contract...');
        try {
            if (typeof TruffleContract === 'undefined') {
                throw new Error('TruffleContract not loaded');
            }

            const todoList = await $.getJSON('/contracts/TodoList.json');
            console.log('Contract JSON loaded:', todoList);
            
            App.contracts.TodoList = TruffleContract(todoList);
            App.contracts.TodoList.setProvider(App.web3Provider);
            
            console.log('Contract initialized');
            
            App.todoList = await App.contracts.TodoList.deployed();
            if (!App.todoList) {
                throw new Error('Contract not deployed');
            }
            console.log('Contract instance loaded:', App.todoList);
        } catch (error) {
            console.error('Error loading contract:', error);
            throw error;
        }
    },

    render: async () => {
        if (App.loading) return;
        App.setLoading(true);

        try {
            // Format and render account
            const shortAddress = App.account.slice(0, 6) + '...' + App.account.slice(-4);
            $('#account').html(shortAddress);
            
            await App.renderTasks();
        } catch (error) {
            console.error('Error rendering:', error);
            $('#content').html(`
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Error loading tasks. Please try refreshing the page.
                </div>
            `);
        } finally {
            App.setLoading(false);
        }
    },

    renderTasks: async () => {
        try {
            const taskCount = await App.todoList.taskCount();
            const $taskTemplate = $('#taskTemplate');
            const $taskList = $('#taskList');
            const $completedTaskList = $('#completedTaskList');

            // Clear existing tasks
            $taskList.find('.task-item').not('#taskTemplate').remove();
            $completedTaskList.empty();

            if (taskCount == 0) {
                $taskList.append(`
                    <div class="text-center text-muted p-3">
                        <i class="fas fa-clipboard-list mb-2" style="font-size: 2rem;"></i>
                        <p class="mb-0">No tasks yet. Add your first task above!</p>
                    </div>
                `);
            }

            for (var i = 1; i <= taskCount; i++) {
                const task = await App.todoList.tasks(i);
                const taskId = task[0].toNumber();
                const taskContent = task[1];
                const taskCompleted = task[2];

                const $newTaskTemplate = $taskTemplate.clone();
                $newTaskTemplate.find('.task-content').html(taskContent);
                $newTaskTemplate.find('input[type="checkbox"]')
                    .prop('name', taskId)
                    .prop('checked', taskCompleted)
                    .on('click', App.toggleCompleted);
                
                if (taskCompleted) {
                    $completedTaskList.append($newTaskTemplate);
                } else {
                    $taskList.append($newTaskTemplate);
                }

                $newTaskTemplate.show();
            }

            // Show "no completed tasks" message if needed
            if ($completedTaskList.children().length === 0) {
                $completedTaskList.append(`
                    <div class="text-center text-muted p-3">
                        <i class="fas fa-check-circle mb-2" style="font-size: 2rem;"></i>
                        <p class="mb-0">No completed tasks yet.</p>
                    </div>
                `);
            }
        } catch (error) {
            console.error('Error rendering tasks:', error);
            throw error;
        }
    },

    createTask: async () => {
        const content = $('#newTask').val().trim();
        if (!content) return;

        App.setLoading(true);
        try {
            console.log('Creating task with content:', content);
            console.log('Using account:', App.account);
            
            // Get gas estimate first
            const gasEstimate = await App.todoList.createTask.estimateGas(content, { from: App.account });
            console.log('Estimated gas:', gasEstimate);
            
            // Call the contract with the estimated gas
            const result = await App.todoList.createTask(content, {
                from: App.account,
                gas: Math.floor(gasEstimate * 1.5) // Add 50% buffer for safety
            });
            
            console.log('Transaction result:', result);
            $('#newTask').val('');
            window.location.reload();
        } catch (error) {
            console.error('Detailed error:', error);
            let errorMessage = 'Error creating task. ';
            
            if (error.message.includes('gas')) {
                errorMessage += 'Insufficient gas. Please check your ETH balance.';
            } else if (error.message.includes('rejected')) {
                errorMessage += 'Transaction was rejected. Please try again.';
            } else {
                errorMessage += error.message;
            }
            
            alert(errorMessage);
            App.setLoading(false);
        }
    },

    toggleCompleted: async(e) => {
        App.setLoading(true);
        try {
            const taskId = e.target.name;
            console.log('Toggling task:', taskId);
            console.log('Using account:', App.account);

            // Get gas estimate first
            const gasEstimate = await App.todoList.toggleCompleted.estimateGas(taskId, { from: App.account });
            console.log('Estimated gas:', gasEstimate);

            // Call the contract with the estimated gas
            const result = await App.todoList.toggleCompleted(taskId, {
                from: App.account,
                gas: Math.floor(gasEstimate * 1.5) // Add 50% buffer for safety
            });
            
            console.log('Transaction result:', result);
            window.location.reload();
        } catch (error) {
            console.error('Detailed error:', error);
            let errorMessage = 'Error updating task. ';
            
            if (error.message.includes('gas')) {
                errorMessage += 'Insufficient gas. Please check your ETH balance.';
            } else if (error.message.includes('rejected')) {
                errorMessage += 'Transaction was rejected. Please try again.';
            } else if (error.message.includes('invalid')) {
                errorMessage += 'Invalid task ID. Please try again.';
            } else {
                errorMessage += error.message;
            }
            
            alert(errorMessage);
            App.setLoading(false);
        }
    },

    setLoading: (loading) => {
        App.loading = loading;
        const loader = $('#loader');
        const content = $('#content');
        if (loading) {
            loader.show();
            content.hide();
        } else {
            loader.hide();
            content.show();
        }
    }
}

$(() => {
    $(window).on('load', () => {
        App.load();
    });
});