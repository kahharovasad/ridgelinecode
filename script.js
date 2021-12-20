const sortByKey = (jobs, k) => {
    const key = k || 'title';
    return jobs.sort((a, b) => {
        if (a[key] < b[key]) {
            return -1;
        }
        if (a[key] > b[key]) { 
            return 1;
        }
        return 0;
    });
};
const renderAccordionInnerJob = (job) => {
    return `
    <a
    href="${job.absolute_url}"
    target="_blank"
    class="accordion__item w-inline-block">
    <div class="accordion__item-title">${job.title}</div>
    <div class="accordion__item-location">${job.location.name}</div>
    </a>
    `;
};
const renderAccordions = departments => {
    return departments.map(department => {
        const jobs = department.jobs.map(job => renderAccordionInnerJob(job));
        return `
        <div class="careers-accordion accordion__status-closed">
        <div class="accordion__title">
        <div class="accordion__title-text">${department.name}</div>
        <img
        src="https://global-uploads.webflow.com/6126ab68c73f925bdc355c97/61bb1fc27e28fcef00a256db_accordion-icon.svg"
        loading="lazy"
        alt=""
        class="accordion__icon icon-close"
        >
        </div>
        <div class="accordion__body std-height-0">${jobs.join('')}</div>
        </div>
        `;
    });
};
const setAccordionActions = () => {
    function findAccordionNode(node) {
        if (!node.parentNode) {
            return null;
        }
        if (node.classList.contains('careers-accordion')) {
            return node;
        }
        return findAccordionNode(node.parentNode);
    }
    $('.careers-accordion .accordion__title').click(event => {
        const node = findAccordionNode(event.target);
        const isClosed = node.classList.contains('accordion__status-closed');
        if (isClosed) {
            node.classList.remove('accordion__status-closed');
            node.classList.add('accordion__status-opened');
            $(node).find('.accordion__body').removeClass('std-height-0');
            $(node).find('.accordion__icon').addClass('icon-open');
            $(node).find('.accordion__icon').removeClass('icon-close');
            return;
        }
        node.classList.remove('accordion__status-opened');
        node.classList.add('accordion__status-closed');
        $(node).find('.accordion__body').addClass('std-height-0');
        $(node).find('.accordion__icon').removeClass('icon-open');
        $(node).find('.accordion__icon').addClass('icon-close');
    });
};
const setDepartmentSearchOptions = (departments) => {
    const filterByDepartment = $('#Department')[0];
    if (!filterByDepartment) {
        return;
    }
    return filterByDepartment.innerHTML = [
    `<option selected>Department</option>`,
    ...departments.map(department => `<option value="${department.name}">${department.name}</option>`)
    ]
    .join('');
};
const setLocationSearchOptions = (jobs) => {
    const filterByLocation = $('#Location')[0];
    if (!filterByLocation) {
        return;
    }
    const locations = sortByKey([
        { name: 'Incline Village, NV', value: 'Incline Village' },
        { name: 'Reno, NV', value: 'Reno' },
        { name: 'New York', value: 'New York' },
        { name: 'Remote', value: 'Remote' },
        { name: 'United States', value: 'United States' },
        { name: 'Nevada', value: 'NV' },
        ], 'name');
// now the list is next
// "Incline Village, NV"
// "Incline Village, NV or New York City"
// "Incline Village, NV or Reno, NV"
// "Incline Village, NV or Reno, NV or NYC"
// "Incline Village, NV or Reno, NV, New York"
// "Incline Village, NV, Reno, NV"
// "Incline Village, Nevada or New York, New York or Reno, Nevada"
// "New York"
// "New York City"
// "New York City, NY or Reno, NV"
// "New York, New York or Reno, Nevada"
// "New York, New York, United States, Reno, Nevada, United States"
// "Remote"
// "Reno or New York City"
// "Reno, NV"
// "Reno, NV or NYC"
// "Reno, NV or New York City, NY"
// get all locations from API, but we have sometimes NY or New York City or New York or NYC
// const locations2 = jobs
//     .reduce((acc, job) => {
//         if (!job || !job.location || !job.location.name) {
//             return acc;
//         }
//         return [...acc, job.location.name];
//     }, [])
//     .filter(
//         (value, index, self) => self.indexOf(value) === index
//     )
//     .sort();
//     console.log(`locations2`, locations2);
return filterByLocation.innerHTML = [
`<option selected>Location</option>`,
...locations.map(location => `<option value="${location.value}">${location.name}</option>`)
];
};
const generateJobNodes = (data) => {
    const content = $('#jobs .careers-content')[0];
    if (!content) {
        return;
    }
    const departments = data.reduce((acc, item) => {
        const departmentId = item.departments[0] ? item.departments[0].id : null;
        if (!departmentId) {
            return acc;
        }
        if (!acc[departmentId]) {
            acc[departmentId] = {
                jobs: [],
                name: '',
            };
        }
        acc[departmentId].jobs.push(item);
        acc[departmentId].name = item.departments[0].name;
        return acc;
    }, {});
// sorting jobs alphabetically
Object.entries(departments).forEach(([_departmentId, department]) => {
    department.jobs = sortByKey(department.jobs);
});
// sorting departments alphabetically
const preparedDepartments = sortByKey(Object.values(departments), 'name');

const nodes = renderAccordions(preparedDepartments);
content.innerHTML = nodes.join('');
setAccordionActions();
setDepartmentSearchOptions(preparedDepartments);
setLocationSearchOptions(data);
};
/*
* @function: a callback, will call when data comes 
* @argument: jobs: list of jobs
* @argument: meta: total count of jobs
* @returns: getting the list of Jobs 
*/
function processGreenhouseJobsData(data) {
    if (!data) {
        return;
    }
    const { jobs, meta } = data;
    return generateJobNodes(jobs);
}
const jobPostsSearchOptions = {
    q: '',
    location: '',
    department: '',
};
$('#Department').change(function() {
    jobPostsSearchOptions.department = $(this).val() === 'Department'? '' : $(this).val();
    executeJobSearch();
});
$('#Location').change(function() {
    jobPostsSearchOptions.location = $(this).val() === 'Location'? '' : $(this).val();
    executeJobSearch();
});
$("#Search").on('change keyup', _.debounce(function (e) {
    jobPostsSearchOptions.q = e.target.value.trim();
    executeJobSearch();
}, 150, { leading: true, trailing: true }));
function executeJobSearch() {
    $('.careers-content').children().show();
    $('.accordion__item').show();
    $('.search-results').hide();
    if (!jobPostsSearchOptions.department && !jobPostsSearchOptions.location && !jobPostsSearchOptions.q) {
        return;
    }
    if (jobPostsSearchOptions.department) {
        $('.accordion__title').each((index, node) => {
            if (jobPostsSearchOptions.department === node.innerText.trim()) {
                return $(node.parentNode).show();
            }
            return $(node.parentNode).hide();
        });
    }
    if (jobPostsSearchOptions.location) {
        const searchValue = jobPostsSearchOptions.location.trim().toLowerCase();
        const accordions = $('.careers-accordion').filter(function() {
            return $(this).css('display') === 'none' ? false : true;
        });
        accordions.each((index, accordion) => {
            let hasSearchJob = false;
            const jobs = $(accordion).find('.accordion__item');
            jobs.each((index, job) => {
                const nodeText = job.innerText.trim().toLowerCase();
                if (nodeText.includes(searchValue)) {
                    hasSearchJob = true;
                    return;
                }
                return $(job).hide();
            });

            if (!hasSearchJob) {
                $(accordion).hide();
            }
        });
    }
    if (jobPostsSearchOptions.q.length >= 2) {
        const searchValue = jobPostsSearchOptions.q.toLowerCase();
        const accordions = $('.careers-accordion').filter(function() {
            return $(this).css('display') === 'none' ? false : true;
        });
        accordions.each((index, accordion) => {
            let hasSearchJob = false;
            const jobs = $(accordion).find('.accordion__item');
            jobs.each((index, job) => {
                const nodeText = job.innerText.trim().toLowerCase();
                if (nodeText.includes(searchValue)) {
                    hasSearchJob = true;
                    return;
                }
                return $(job).hide();
            });

            if (!hasSearchJob) {
                $(accordion).hide();
            }
        });
    }
// check on results length
const accordions = $('.careers-accordion').filter(function() {
    return $(this).css('display') === 'none' ? false : true;
});
if (!accordions.length) {
    $('.search-results').show();
}
};