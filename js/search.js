require([
    "esri/tasks/QueryTask",
    "esri/tasks/query",
    "esri/tasks/RelationshipQuery",
    "esri/symbols/SimpleMarkerSymbol",
    "app/config"],
    function (QueryTask, Query, RelationshipQuery, SimpleMarkerSymbol, appConfig) {

        function relationQueryCompelete(relatedRecords) {
            var objectId, featureArray, firstFeature;

            console.log(relatedRecords);
            for (objectId in relatedRecords) {
                featureArray = relatedRecords[objectId].features;
                firstFeature = featureArray[0];
                $("#review" + objectId).html(
                    String.format(
                        "<i>{0}</i>,<br>by user <i> {1}</i>",
                        firstFeature.attributes["review"],
                        firstFeature.attributes["user_"]));
            }
        }

        function picturesQueryComplete(pictures) {
            //in case of no pictures quit.
            if (pictures.length == 0) return;
            //get the first picture
            var firstPicture = pictures[0];
            //set it to its place holder
            $("#picture" + firstPicture.objectId).html(
                String.format(
                    "<img src='{0}' class='review-picture'>",
                    firstPicture.url));
        }

        function showRestaurant(i) {
            var
                name = $(this).text(),
                symbol,
                currentFeature,
                relatedReviews;

            //find the feature by name
            for (var i = 0; i < app.queryResults.features.length; i++) {
                if (name === app.queryResults.features[i].attributes.name) {
                    currentFeature = app.queryResults.features[i];
                    break;
                }
            }

            if (!currentFeature) return;

            //create symbol
            symbol = new SimpleMarkerSymbol();
            symbol.setSize(50);
            symbol.setColor(new dojo.Color([255, 255, 0, 0.5]));

            //finally set the symbol to the record
            currentFeature.setSymbol(symbol);


            //clear any graphics on the map
            app.map.graphics.clear();
            //so we only add this one
            app.map.graphics.add(currentFeature);
        }

        function addReviews(results) {
            var
                i = 0,
                currentFeature,
                relatedReviews;
            for (i = 0; i < results.features.length; i++) {

                currentFeature = results.features[i];

                //Create relationship query object
                relatedReviews = new RelationshipQuery();
                relatedReviews.outFields = ["*"];
                //The relationship id is zero based on the url
                relatedReviews.relationshipId = 0;
                relatedReviews.objectIds = [currentFeature.attributes["objectid"]];
                app.layerFoodAndDrinks.queryRelatedFeatures(relatedReviews, relationQueryCompelete);
            }
        }

        function addPictures(results) {
            var
                i = 0,
                currentFeature;

            for (i = 0; i < results.features.length; i++) {
                currentFeature = results.features[i];
                if (app.layerFoodAndDrinks.hasAttachments) {
                    app.layerFoodAndDrinks.queryAttachmentInfos(currentFeature.attributes["objectid"], picturesQueryComplete);
                }
            }
        }

        function showResults(results) {
            var feature,
                i = 0,
                resultHtml = "";

            //store the results
            app.queryResults = results;

            for (i = 0; i < results.features.length; i = i + 1) {
                //for each single feature or record in the result
                feature = results.features[i];

                //TODO:use handlebar template
                resultHtml = resultHtml + String.format(
                    "<b>Name:</b><a>{0}</a><br/> <b>Rating:</b>{1}<div id='review{2}'></div><div id='picture{2}'></div><br>",
                    feature.attributes["name"],
                    feature.attributes["rating"],
                    feature.attributes["objectid"]
                ); //place a holder for each review to be populated
                resultHtml = resultHtml + String.format(
                    "Review:<input type='text' id='inputReview{0}'><br> Rating:<input type='text' id='inputRating{0}'> <br><input type='button' value='Add' id='btn{0}'><br><br>",
                    feature.attributes["objectid"]);
            }

            $("#search-result").html(resultHtml);

            //highlight the feature
            $.each($("#search-result a"), function (index, value) {
                $(value).click(showRestaurant);
            });

            //submit new review
            $.each($("#search-result input[type='button']"), function (index, value) {
                $(value).click(function(){

                    //obtain oid
                    var oid=$(this).attr("id").substring(3);
                    console.log(oid);

                    var objectid = oid;
                    var review = $("#inputReview" + oid).val();
                    var rating = $("#inputRating" + oid).val();
                    var newReview = {
                        attributes: {
                            venue_objectid: objectid,
                            review: review,
                            rating: rating,
                            user_: "yinchao"
                        }
                    };
                    //apply edits and pass the review record
                    app.layerReviewTable.applyEdits([newReview], null, null, null, null);

                    alert("Congratulations!Review has been added.");
                });
            });

            //add review
            addReviews(results);
            addPictures(results);
        }

        //search button click event handler
        $("#search-submit").click(function (event) {

            //execute a query against ags server map layer
            var
                query,
                searchText = $("#search-text").val().trim();

            //create task
            app.queryTask = new QueryTask(
                appConfig.layers.belizeMapService.url + "/0"
            );

            //null empty results
            if (!searchText) {
                $("#search-result").html("");
                return;
            }

            query = new Query();
            query.outFields = ["name", "rating", "objectid"];
            query.returnGeometry = true;

            //support lowerCase or upperCase insensitive
            query.where = String.format(
                "UPPER(name) LIKE '%{0}%'",
                searchText.toUpperCase()
            );

            app.queryTask.execute(query, showResults);
        });

    });
