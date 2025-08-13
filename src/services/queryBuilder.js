class QueryBuilder {
    constructor(model, includeDeleted = false) {
        this.model = model;
        this.query = null;
        this.includeDeleted = includeDeleted;
        this.filterConditions = {}; // countDocuments ke liye store karenge
    }

    // ---------- READ ----------
    filter(fields = {}) {
        // Deleted ko handle karo
        this.filterConditions = this.includeDeleted ? fields : { isDeleted: false, ...fields };
        this.query = this.model.find(this.filterConditions);
        return this;
    }

    findOne(fields = {}) {
        this.filterConditions = this.includeDeleted ? fields : { isDeleted: false, ...fields };
        this.query = this.model.findOne(this.filterConditions);
        return this;
    }

    select(fields = "") {
        this.query = this.query.select(fields);
        return this;
    }

    sort(sortBy = "") {
        this.query = this.query.sort(sortBy);
        return this;
    }

    search(searchText = "", keys = []) {
        if (!searchText || !Array.isArray(keys) || keys.length === 0) return this;
        console.log(searchText, keys);

        const searchRegex = new RegExp(searchText, "i");

        const searchConditions = {
            $or: keys.map(key => ({ [key]: searchRegex }))
        };
        console.log(searchConditions, "searchConditions");
        // Merge existing filter conditions with search conditions using $and
        const finalConditions = {
            $and: [this.filterConditions, searchConditions]
        };
        console.log(finalConditions, "finalConditions");
        this.query = this.model.find(finalConditions);
        return this;
    }

    paginate(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }

    aggregate(pipeline = []) {
        this.query = this.model.aggregate(pipeline);
        return this;
    }

    // ---------- COUNT ----------
    async count() {
        return await this.model.countDocuments(this.filterConditions);
    }

    // ---------- CREATE ----------
    create(data) {
        this.query = this.model.create(data);
        return this;
    }

    // ---------- UPDATE ----------
    update(filter, updateData, options = { new: true }) {
        this.query = this.model.findOneAndUpdate(filter, updateData, options);
        return this;
    }

    // ---------- DELETE ----------
    delete(filter) {
        this.query = this.model.findOneAndUpdate(filter, { isDeleted: true, deletedAt: new Date() }, { new: true });
        return this;
    }

    // ---------- EXECUTE ----------
    async exec() {
        return await this.query;
    }
}

module.exports = QueryBuilder;
