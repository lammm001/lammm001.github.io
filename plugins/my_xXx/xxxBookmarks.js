function XxxBookmarks(component) {

    this.getItems = function (page, filterItems, onComplete, onError) {
        onComplete(Lampa.Storage.get('xxx_bookmarks').map(item => {
            item.isBookmark = true;
            return item
        }))
    }
}


export default XxxBookmarks
