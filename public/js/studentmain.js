let searchbookbtn = document.querySelector('.search-book-btn');

searchbookbtn.addEventListener('click', function(){
    let bookstab = document.getElementById('v-pills-Librarybooks');
    bookstab.classList.remove('show');
    bookstab.classList.remove('active');
    let searchtab = document.getElementById('v-pills-booksearch');
    searchtab.classList.add('show');
    searchtab.classList.add('active');
})
