class QueryBuilder {
    constructor(model) {
        this.model = model;
        this.query = null;
    }

    // ---------- READ ----------
    filter(fields = {}) {
        this.query = this.model.find(fields);
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

    paginate(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }

    aggregate(pipeline = []) {
        this.query = this.model.aggregate(pipeline);
        return this;
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
        this.query = this.model.findOneAndDelete(filter);
        return this;
    }

    // ---------- EXECUTE ----------
    async exec() {
        return await this.query;
    }
}

module.exports = QueryBuilder;
