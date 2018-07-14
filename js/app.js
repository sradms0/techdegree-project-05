const employeeModule = (function() {
    const details = 'picture,name,location,email,phone,dob';
    const count = 12;
    const url = `https://randomuser.me/api/?results=${count}&inc=${details}&nat=us`;
    const modalWindow = document.querySelector('.modal-window');
    const employeeList = document.querySelector('.employee-list');
    const search = document.querySelector('.search');
    const page = document.querySelector('.page');
    const overlay = document.querySelector('.overlay');

    const fetchData = (url) => {
        return fetch(url)
                .then(checkResponse)
                .then(response => response.json())
                .catch(error => alert('error: ', error));
    }

    const checkResponse = (response) => {
        if (response.ok) {
            return Promise.resolve(response);
        } else {
            return Promise.reject(new Error(response.statusText));
        }
    }

    const mainGenerator = (data, link) => {
        const title = (string) => {
            return (`${string}`)
                   .split(' ')
                   .map((i) => `${i[0].toUpperCase()}${i.slice(1)}`)
                   .join(' ');
        }

        // refactor fetched object to new object with only needed data
        const parse = () => {
            return {
                avatar: {info: data.picture.large, type: 'main'},
                name: {info: title(`${data.name.first} ${data.name.last}`), type: 'main'},
                location: {info: title(
                                    `${data.location.street} ${data.location.city}, ${data.location.state} ${data.location.postcode}`
                                 ),
                           type: 'other'},
                email: {info: data.email, type: 'main'},
                city: {info: title(`${data.location.city}`), type: 'main'},
                phone: {info: data.phone, type: 'other'},
                dob: {info: `Birthday: ${new Date(data.dob.date).toLocaleDateString()}`, type: 'other'}
            };
        }

        const generateDetails = (employee, key) => {
            const div = document.createElement('div');
            div.className = key;
            if (employee[key].type === 'main') {
                div.classList.add('clickable');
            }
            if (employee[key].info.includes('.jpg')) {
                const img = document.createElement('img');
                img.src = employee[key].info;
                img.classList.add('clickable');
                div.innerHTML = img.outerHTML;
            } else {
                div.innerText = employee[key].info;
            }
            return div;
        }

        const generateProfile = () => {
            const employee = parse();
            const employeeItem = document.createElement('employeeItem');
            const mainDiv = document.createElement('div');
            const otherDiv = document.createElement('div');
            employeeItem.classList.add('employee-item', 'clickable')
            // create a link # for each item for modal navigation
            // *see modalGenerator
            employeeItem.setAttribute('data-link', link);
            mainDiv.classList.add('employee-details', 'main', 'clickable');
            otherDiv.classList.add('employee-details','other', 'hidden');

            // colllect details for divs 
            const add = (div) => {
                const type = div.classList[1];
                Object.keys(employee)
                      .filter(i => employee[i].type === type)
                      .forEach(i => div.appendChild( generateDetails(employee, i)) );
                employeeItem.appendChild(div);
                employeeList.append(employeeItem);
            }
            add(mainDiv);
            add(otherDiv);
        }

        return generateProfile();
    }

    const modalGenerator = (employeeItem) => {
        // copy the outer html of item into modal content 
        // and be sure to get link # for navigation
        const modalEmployee = employeeItem.firstChild.outerHTML + 
            employeeItem.lastChild.outerHTML;
        modalWindow.children[1].innerHTML = modalEmployee;
        modalWindow.setAttribute('data-link', 
            employeeItem.getAttribute('data-link'));
    }

    const generateAll = (url) => {
        fetchData(url)
            .then(data => {
                data.results
                .forEach((i, idx) => mainGenerator(i, idx));
            });
    }

    const employeeMouseHandler = (e) => {
        if (e.target.classList.contains('clickable')) {
            const type = e.type;
            // all divs in the employee-item div
            // to give the employee-item div
            //  item its change in animated background,
            //  ensure that it is always selected
            //  (grab the 'main' parent of the detail item selected
            //   if '.employee-item' was not selected)
            const employeeItem = ( e.target.classList.contains('.employee-item') )
                ? e.target : e.target.closest('.employee-item');

            if (type === 'mouseover') {
                employeeItem.classList.add('hovered');
            } else if (type === 'mouseout'){
                employeeItem.classList.remove('hovered');
            // modal window opening;
            } else if (type === 'click') {
                page.classList.add('disabled');
                overlay.classList.add('disabled');
                modalWindow.classList.add('reveal');

                modalGenerator(employeeItem);
                // disable clickable elements;
                const employeeDetails = modalWindow
                    .querySelectorAll('.employee-details');
                page.classList.add('disabled');
                employeeDetails[0]
                    .classList.add('disabled');
                employeeDetails[1]
                    .classList.replace('hidden', 'disabled');

            }
        }
    };

    const modalMouseHandler = (e) => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            const a = e.target;
            if (a.classList.contains('modal-exit')) {
                page.classList.remove('disabled');
                overlay.classList.remove('disabled');
                modalWindow.classList.remove('reveal');
            } else if (a.classList.contains('modal-nav')) {
                const nextLink = () => {
                    // get the current link of current employee in modal window
                    // get link+1 or link-1 depending on nav button selected
                    // account for when modal window employee link is either
                    //  the last employee or the first to avoid fetching
                    //  non-existen link
                    let link = parseInt(modalWindow.getAttribute('data-link'));
                    if (a.classList.contains('modal-nav-next')) {
                        link++;
                        if (link === count) {
                            link = 0;
                        }
                    } else if (a.classList.contains('modal-nav-prev')) {
                        link--;
                        if (link < 0) {
                            link = count - 1;
                        }
                    }
                    return link;
                };
                const employeeItem = document.querySelector(
                    `.employee-item[data-link="${nextLink()}"]`);
                modalGenerator(employeeItem);
            }
        }
    };
    employeeList.addEventListener('mouseover', (e) => employeeMouseHandler(e));
    employeeList.addEventListener('mouseout', (e) => employeeMouseHandler(e));
    employeeList.addEventListener('click', (e) => employeeMouseHandler(e));
    modalWindow.addEventListener('click', (e) => modalMouseHandler(e));
    search.addEventListener('keyup', (e) => {
        const name = e.target.value.toLowerCase();

        // reveal all hidden employees
        document.querySelectorAll('.employee-item.hidden')
        .forEach(i => i.classList.remove('hidden'));

        // hide employees not matching search
        [...document.querySelectorAll('.name')]
        .filter(i => !i.innerText.toLowerCase().includes(name))
        .forEach(i => i.parentNode.parentNode.classList.add('hidden'));
    });

    // create directory display
    generateAll(url);
    window.onbeforeunload = () => {
      window.scrollTo(0, 0);
    }
}());
