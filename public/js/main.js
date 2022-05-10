let addbookbtn = document.querySelector('.add-book-btn');
let searchbookbtn = document.querySelector('.search-book-btn');
// let removestudentbtn = document.querySelector('.removestudent')
// let returnbookbtn = document.querySelector('.returnbookbtn');
//let editbookbtn = document.querySelector('.edit-button');

addbookbtn.addEventListener('click', function(){
    let bookstab = document.getElementById('v-pills-books');
    bookstab.classList.remove('show');
    bookstab.classList.remove('active');
    let addtab = document.getElementById('v-pills-addbook');
    addtab.classList.add('show');
    addtab.classList.add('active');
})

searchbookbtn.addEventListener('click', function(){
    let bookstab = document.getElementById('v-pills-books');
    bookstab.classList.remove('show');
    bookstab.classList.remove('active');
    let searchtab = document.getElementById('v-pills-booksearch');
    searchtab.classList.add('show');
    searchtab.classList.add('active');
})

// removestudentbtn.addEventListener('click', function(){
//     document.cookie = "pageload" + "=" + "2";
//     // if("<%= pageload %>" == 2)
//     // {
//     //     let bookstab = document.getElementById('v-pills-books');
//     //     bookstab.classList.remove('show');
//     //     bookstab.classList.remove('active');
//     //     let studentpage = document.getElementById('v-pills-students');
//     //     studentpage.classList.add('show');
//     //     studentpage.classList.add('active');
//     // }
// })

// returnbookbtn.addEventListener('click', function(){
//     document.cookie = "pageload" + "=" + "3";
// })

// editbookbtn.addEventListener('click', function(){
//     let bookstab = document.getElementById('v-pills-books');
//     bookstab.classList.remove('show');
//     bookstab.classList.remove('active');
//     let edittab = document.getElementById('v-pills-editbook');
//     edittab.classList.add('show');
//     edittab.classList.add('active');
// })