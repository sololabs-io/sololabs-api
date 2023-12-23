export class PageToken {
    pageSize: number;
    ids: string[];
    searchQuery: string | undefined;
    mintToken: string | undefined;

    constructor(ids: string[], pageSize: number, searchQuery: string | undefined, mintToken: string | undefined){
        this.ids = ids;
        this.pageSize = pageSize;
        this.searchQuery = searchQuery;
        this.mintToken = mintToken;
    }

    toJSON() {
        return Buffer.from(JSON.stringify({
            ids: this.ids, 
            pageSize: this.pageSize, 
            searchQuery: this.searchQuery, 
            mintToken: this.mintToken
        })).toString('base64');
    }

    static parse(tokenString?: string): PageToken | undefined {
        if (tokenString == undefined) return undefined;

        try {
            const pageToken:PageToken = JSON.parse(Buffer.from(tokenString, 'base64').toString('ascii'));
            return pageToken;
        }
        catch (error){
            console.error(error);
        }

        return undefined;
    }
}