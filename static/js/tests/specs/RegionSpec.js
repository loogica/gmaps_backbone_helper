describe('Region Spec', function() {
    it('Model must have default configs', function() {
        var region = new Region();

        expect(region.get('name')).toBe("Region Name");
    });
});
