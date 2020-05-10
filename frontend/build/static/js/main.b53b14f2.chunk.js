(this.webpackJsonpfrontend=this.webpackJsonpfrontend||[]).push([[0],{102:function(e,t,a){e.exports=a(526)},111:function(e,t,a){},112:function(e,t,a){},5:function(e,t,a){a(67).config(),e.exports={host:"https://zen-camino.com",port:""}},51:function(e,t){},526:function(e,t,a){"use strict";a.r(t);var n=a(0),s=a.n(n),r=a(37),c=a.n(r),o=a(7),i=a(24),l={isLoggedIn:!1},m=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:l,t=arguments.length>1?arguments[1]:void 0;switch(t.type){case"SET_SESSION":return Object.assign({},t.session,{isLoggedIn:!0});case"CLEAR_SESSION":return l;default:return e}},u=Object(i.c)({session:m}),p=a(96),d=window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__||i.d,h=Object(i.e)(u,d(Object(i.a)(p.a))),f=(a(111),a(9)),E=a(10),b=a(12),g=a(11),v=(a(112),a(16)),N=a(25),y=a(13),S=a.n(y),k=a(5),O=a.n(k),j=function(e){Object(b.a)(a,e);var t=Object(g.a)(a);function a(e){var n;return Object(f.a)(this,a),(n=t.call(this,e)).state={users:[],headers:{}},n}return Object(E.a)(a,[{key:"componentDidMount",value:function(){var e=this;if(this.props.session.isLoggedIn){var t={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:t}),S.a.get(O.a.host+O.a.port+"/api/user",t).then((function(t){e.setState({users:t.data})}))}}},{key:"deleteCustomer",value:function(e){var t=this;S.a.delete(O.a.host+O.a.port+"/api/user/".concat(e),this.state.headers).then((function(a){var n=t.state.users.findIndex((function(t){return t.id===e}));t.state.users.splice(n,1),t.props.history.push("/user")}))}},{key:"render",value:function(){var e=this,t=this.state.users;return s.a.createElement("div",{className:"main-container"},s.a.createElement("div",{className:"container"},s.a.createElement("div",{className:"row mx-auto"},s.a.createElement("div",{className:"card um-main-body mx-auto"},s.a.createElement("div",{className:"card-block"},s.a.createElement("div",{className:"card-title"},s.a.createElement("strong",null,"Users")," ",s.a.createElement(v.b,{to:"user/create",className:"btn btn-sm btn-outline-secondary float-right"}," Create New User")),s.a.createElement("div",{className:"card-text"},0===t.length?s.a.createElement("div",{className:"text-center"},s.a.createElement("h2",null,"No users found at the moment")):s.a.createElement("table",{className:"table table-bordered"},s.a.createElement("thead",{className:"thead-light"},s.a.createElement("tr",null,s.a.createElement("th",{scope:"col"},"Username"),s.a.createElement("th",{scope:"col"},"first_name"),s.a.createElement("th",{scope:"col"},"Email"),s.a.createElement("th",{scope:"col"},"Phone"),s.a.createElement("th",{scope:"col"},"Actions"))),s.a.createElement("tbody",null,t&&t.map((function(t){return s.a.createElement("tr",{key:t.Username},s.a.createElement("td",null,t.Username),s.a.createElement("td",null,t.name),s.a.createElement("td",null,t.email),s.a.createElement("td",null,t.phone_number),s.a.createElement("td",null,s.a.createElement("div",{className:"d-flex justify-content-between align-items-center"},s.a.createElement("div",{className:"btn-group",style:{marginBottom:"20px"}},s.a.createElement(v.b,{to:"user/edit/".concat(t.Username),className:"btn btn-sm btn-outline-secondary"},"Edit User"),s.a.createElement("button",{className:"btn btn-sm btn-outline-secondary",onClick:function(){return e.deleteCustomer(t.Username)}},"Delete User")))))}))))))))))}}]),a}(n.Component),C=Object(o.b)((function(e){return{session:e.session}}))(j),w=(a(68),function(e){Object(b.a)(a,e);var t=Object(g.a)(a);function a(e){var n;return Object(f.a)(this,a),(n=t.call(this,e)).state={recipes:[],headers:{},isAdmin:!1},n}return Object(E.a)(a,[{key:"componentDidMount",value:function(){var e=this;if(this.props.session.isLoggedIn){var t=-1!==this.props.session.groups.indexOf("Admin");this.setState({isAdmin:t});var a={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:a}),S.a.get(O.a.host+O.a.port+"/api/recipe",a).then((function(t){e.setState({recipes:t.data})}))}}},{key:"deleteRecipe",value:function(e){var t=this;S.a.delete(O.a.host+O.a.port+"/api/recipe/".concat(e),this.state.headers).then((function(a){var n=t.state.recipes.findIndex((function(t){return t.id===e}));t.state.recipes.splice(n,1),t.props.history.push("/recipe")}))}},{key:"render",value:function(){var e=this,t=this.state.recipes;return s.a.createElement("div",{className:"main-container"},s.a.createElement("div",{className:"container"},s.a.createElement("div",{className:"row"},s.a.createElement("div",{className:"card um-main-body mx-auto"},s.a.createElement("div",{className:"card-block"},s.a.createElement("div",{className:"card-title"},s.a.createElement("strong",null,"Recipes"),s.a.createElement(v.b,{to:"recipe/create",className:"btn btn-sm btn-outline-secondary float-right"}," Create New Recipe")),s.a.createElement("div",{className:"card-text"},0===t.length?s.a.createElement("div",{className:"text-center"},s.a.createElement("h2",null,"No recipe found at the moment")):s.a.createElement("table",{className:"table table-bordered table-striped"},s.a.createElement("thead",{className:"thead-light"},s.a.createElement("tr",null,s.a.createElement("th",{scope:"col"},"name"),s.a.createElement("th",{scope:"col"},"preview"),s.a.createElement("th",{scope:"col"},"submitted_by"),s.a.createElement("th",{scope:"col"},"Is Public"),s.a.createElement("th",{scope:"col"},"Rating"),s.a.createElement("th",{scope:"col"},"Actions"))),s.a.createElement("tbody",null,t&&t.map((function(t){return(e.state.isAdmin||t.isPublic)&&s.a.createElement("tr",{key:t.id},s.a.createElement("td",null,t.name),s.a.createElement("td",null,"..."),s.a.createElement("td",null,t.submitted_by),s.a.createElement("td",null,t.isPublic?"1":"0"),s.a.createElement("td",null,t.rating),s.a.createElement("td",null,s.a.createElement("div",{className:"d-flex justify-content-between align-items-center"},s.a.createElement("div",{className:"btn-group",style:{marginBottom:"20px"}},s.a.createElement(v.b,{to:"recipe/".concat(t.id),className:"btn btn-sm btn-success btn-outline-secondary"},"View Recipe "),s.a.createElement(v.b,{to:"recipe/edit/".concat(t.id),className:"btn btn-warning btn-sm btn-outline-secondary"},"Edit Recipe "),s.a.createElement("button",{type:"button",className:"btn btn-danger btn-sm btn-outline-secondary",onClick:function(){return e.deleteRecipe(t.id)}},"Delete Recipe")))))}))))))))))}}]),a}(n.Component)),x=Object(o.b)((function(e){return{session:e.session}}))(w),I=function(e){Object(b.a)(a,e);var t=Object(g.a)(a);function a(e){var n;return Object(f.a)(this,a),(n=t.call(this,e)).state={recipe:[],headers:{}},n}return Object(E.a)(a,[{key:"componentDidMount",value:function(){var e=this;if(this.props.session.isLoggedIn){var t={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:t}),S.a.get(O.a.host+O.a.port+"/api/recipe/"+this.props.match.params.id,this.state.headers).then((function(t){!e.props.session.isAdmin&&!t.data[0].isPublic||0===t.data.length?e.props.history.push("/recipe"):e.setState({recipe:t.data[0]})})).catch((function(t){return e.props.history.push("/recipe")}))}}},{key:"render",value:function(){var e=this.state.recipe;return s.a.createElement("div",{className:"main-container"},s.a.createElement("div",{className:"container"},s.a.createElement("div",{className:"row"},s.a.createElement("div",{className:"card recipe"},s.a.createElement("div",{className:"container"},s.a.createElement("div",{className:"wrapper row"},s.a.createElement("div",{className:"preview col-md-6"},s.a.createElement("div",{className:"preview-pic tab-content"},s.a.createElement("div",{className:"tab-pane active",id:"pic-1"},s.a.createElement("img",{src:"https://umanage-mowatr.s3.amazonaws.com/"+e.picture,alt:"recipe"})))),s.a.createElement("div",{className:"details col-md-6"},s.a.createElement("h3",{className:"recipe-title"},e.name),s.a.createElement("h5",{className:"submitted-by"},"By ",s.a.createElement("span",null,e.submitted_by)),s.a.createElement("h5",{className:"review-no"},"Rated: ",e.rating,"/10"),s.a.createElement("div",{className:"rating"},s.a.createElement("div",{className:"stars"},s.a.createElement("span",{className:"fa fa-star checked"}),s.a.createElement("span",{className:"fa fa-star checked"}),s.a.createElement("span",{className:"fa fa-star checked"}),s.a.createElement("span",{className:"fa fa-star"}),s.a.createElement("span",{className:"fa fa-star"}))),s.a.createElement("h5",{className:"review-no"},"Recipe:"),s.a.createElement("p",{className:"recipe-description"},e.recipe))))))))}}]),a}(n.Component),_=Object(o.b)((function(e){return{session:e.session}}))(I),F=a(21),T=a(42),U=function(e){Object(b.a)(a,e);var t=Object(g.a)(a);function a(e){var n;return Object(f.a)(this,a),(n=t.call(this,e)).processFormSubmission=function(e){e.preventDefault(),n.setState({loading:!0});var t={userName:n.state.userName,name:n.state.name,email:n.state.email,phone_number:n.state.phone_number};n.setState({submitSuccess:!0,values:[].concat(Object(T.a)(n.state.values),[t]),loading:!1}),n.props.session.isLoggedIn&&S.a.post(O.a.host+O.a.port+"/api//user",t,n.state.headers).then((function(e){return[setTimeout((function(){n.props.history.push("/user")}),1500)]})).catch((function(e){n.setState({submitSuccess:!1,submitFail:!0,errorMessage:e.response.data.message}),console.log(e)}))},n.handleInputChanges=function(e){e.preventDefault(),n.setState(Object(F.a)({},e.currentTarget.name,e.currentTarget.value))},n.state={userName:"",name:"",email:"",phone_number:"",values:[],loading:!1,submitSuccess:!1,submitFail:!1,errorMessage:null,headers:{}},n}return Object(E.a)(a,[{key:"componentDidMount",value:function(){if(this.props.session.isLoggedIn){var e={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:e})}}},{key:"render",value:function(){var e=this,t=this.state,a=t.submitSuccess,s=t.submitFail,r=t.loading,c=t.errorMessage;return n.createElement("div",{className:"main-container"},n.createElement("div",{className:"container"},n.createElement("div",{className:"row"},n.createElement("div",{className:"card mx-auto"},n.createElement("div",{className:"card-text"},n.createElement("div",{className:"row"},n.createElement("div",{className:"col-md-12 "},n.createElement("h2",null," Create User "),!a&&n.createElement("div",{className:"alert alert-info",role:"alert"},"Fill the form below to create a new post"),a&&n.createElement("div",{className:"alert alert-info",role:"alert"},"The form was successfully submitted!"),s&&n.createElement("div",{className:"alert alert-info",role:"alert"},c),n.createElement("form",{className:"row",id:"create-post-form",onSubmit:this.processFormSubmission,noValidate:!0},n.createElement("div",{className:"form-group col-md-12"},n.createElement("label",{htmlFor:"first_name"}," User Name "),n.createElement("input",{type:"text",id:"userName",onChange:function(t){return e.handleInputChanges(t)},name:"userName",className:"form-control",placeholder:"Enter unique user name",required:!0})),n.createElement("div",{className:"form-group col-md-12"},n.createElement("label",{htmlFor:"first_name"}," Name "),n.createElement("input",{type:"text",id:"name",onChange:function(t){return e.handleInputChanges(t)},name:"name",className:"form-control",placeholder:"Enter full name",required:!0})),n.createElement("div",{className:"form-group col-md-12"},n.createElement("label",{htmlFor:"email"}," Email "),n.createElement("input",{type:"email",id:"email",onChange:function(t){return e.handleInputChanges(t)},name:"email",className:"form-control",placeholder:"Enter customer's email address",required:!0})),n.createElement("div",{className:"form-group col-md-12"},n.createElement("label",{htmlFor:"phone_number"}," Phone Number "),n.createElement("input",{type:"text",id:"phone_number",onChange:function(t){return e.handleInputChanges(t)},name:"phone_number",className:"form-control",placeholder:"format = +1[phone]",required:!0})),n.createElement("div",{className:"form-group col-md-4 pull-right"},n.createElement("button",{className:"btn btn-success",type:"submit"},"Create User"),r&&n.createElement("span",{className:"fa fa-circle-o-notch fa-spin"}))))))))))}}]),a}(n.Component),R=Object(o.b)((function(e){return{session:e.session}}))(U),D=a(28),A=a(29),L=function(){return s.a.createElement("div",{className:"spinner fadein"},s.a.createElement(D.a,{icon:A.a,size:"5x",color:"#3B5998"}))},P=function(e){return e.images.map((function(t,a){return s.a.createElement("div",{key:a,className:"fadein"},s.a.createElement("div",{onClick:function(){return e.removeImage(t.public_id)},className:"delete"},s.a.createElement(D.a,{icon:A.c,size:"2x"})),s.a.createElement("img",{src:window.URL.createObjectURL(t),alt:""}))}))},M=function(e){return s.a.createElement("div",{className:"buttons fadein"},s.a.createElement("div",{className:"button"},s.a.createElement("div",null,s.a.createElement("input",{type:"file",id:"single",onChange:e.onChange})," "),s.a.createElement(D.a,{icon:A.b,color:"#3B5998",size:"10x"})))},z=function(e){Object(b.a)(a,e);var t=Object(g.a)(a);function a(e){var n;return Object(f.a)(this,a),(n=t.call(this,e)).processFormSubmission=function(e){e.preventDefault(),n.setState({loading:!0});var t=new FormData;t.append("is_public",n.state.is_public),t.append("rating",n.state.rating),t.append("name",n.state.name),t.append("recipe",n.state.recipe),t.append("submitted_by",n.props.session.user.userName),n.state.images.forEach((function(e,a){t.append("photo",e)})),n.setState({submitSuccess:!0,values:[].concat(Object(T.a)(n.state.values),[t]),loading:!1}),n.props.session.isLoggedIn&&(console.log(t),S.a.post(O.a.host+O.a.port+"/api/recipe",t,n.state.headers).then((function(e){return[setTimeout((function(){n.props.history.push("/recipe")}),1500)]})).catch((function(e){n.setState({submitSuccess:!1,submitFail:!0,errorMessage:e.response.data.message}),console.log(e)})))},n.handleInputChanges=function(e){console.log(n.state),e.preventDefault(),n.setState(Object(F.a)({},e.currentTarget.name,e.currentTarget.value)),console.log(n.state)},n.onChange=function(e){var t=Array.from(e.target.files);n.setState({uploading:!1,images:t})},n.removeImage=function(e){n.setState({images:n.state.images.filter((function(t){return t.public_id!==e}))})},n.state={rating:5,is_public:0,name:"",submitted_by:"",recipe:"",values:[],loading:!1,submitSuccess:!1,submitFail:!1,errorMessage:null,images:[],headers:{}},n}return Object(E.a)(a,[{key:"componentDidMount",value:function(){if(this.props.session.isLoggedIn){var e={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken),"content-type":"multipart/form-data"}};this.setState({headers:e})}}},{key:"render",value:function(){var e=this,t=this.state,a=t.submitSuccess,s=t.submitFail,r=t.loading,c=t.errorMessage,o=t.uploading,i=t.images;return n.createElement("div",{className:"main-container"},n.createElement("div",{className:"container"},n.createElement("div",{className:"row"},n.createElement("div",{className:"card mx-auto"},n.createElement("div",{className:"card-text"},n.createElement("div",{className:"col-md-12 "},n.createElement("h2",null," Create Recipe "),!a&&n.createElement("div",{className:"alert alert-info",role:"alert"},"Fill the form below to create a new post"),a&&n.createElement("div",{className:"alert alert-info",role:"alert"},"The form was successfully submitted!"),s&&n.createElement("div",{className:"alert alert-info",role:"alert"},c),n.createElement("form",{className:"row",id:"create-post-form",onSubmit:this.processFormSubmission,noValidate:!1},n.createElement("div",{className:"form-group col-md-12"},n.createElement("label",{htmlFor:"rating"}," What would you rate this Recipe on a scale of 1-10?",n.createElement("select",{value:this.state.rating,onChange:function(t){return e.handleInputChanges(t)},id:"rating",name:"rating",className:"form-control"},n.createElement("option",{value:"1"},"1"),n.createElement("option",{value:"2"},"2"),n.createElement("option",{value:"3"},"3"),n.createElement("option",{value:"4"},"4"),n.createElement("option",{value:"5"},"5"),n.createElement("option",{value:"6"},"6"),n.createElement("option",{value:"7"},"7"),n.createElement("option",{value:"8"},"8"),n.createElement("option",{value:"9"},"9"),n.createElement("option",{value:"10"},"10")))),n.createElement("div",{className:"form-group col-md-12"},n.createElement("label",{htmlFor:"is_public"}," Should this Recipe be Public to ALL logged-in Users?",n.createElement("select",{value:this.state.is_public,onChange:function(t){return e.handleInputChanges(t)},id:"is_public",name:"is_public",className:"form-control"},n.createElement("option",{value:"0"},"Private"),n.createElement("option",{value:"1"},"Public")))),n.createElement("div",{className:"form-group col-md-12"},n.createElement("label",{htmlFor:"first_name"}," Name/Title "),n.createElement("input",{type:"text",id:"name",onChange:function(t){return e.handleInputChanges(t)},name:"name",className:"form-control",placeholder:"Recipe Title",required:!0})),n.createElement("div",{className:"form-group col-md-12"},n.createElement("label",{htmlFor:"recipe"}," Recipe "),n.createElement("textarea",{value:this.state.recipe,onChange:function(t){return e.handleInputChanges(t)},name:"recipe",className:"form-control",placeholder:"Enter the Recipe Here!!",required:!0})),n.createElement("div",null,n.createElement("div",{className:"buttons form-group col-md-12"},function(){switch(!0){case o:return n.createElement(L,null);case i.length>0:return n.createElement(P,{images:i,removeImage:e.removeImage});default:return n.createElement(M,{onChange:e.onChange})}}())),n.createElement("div",{className:"form-group col-md-4 pull-right"},n.createElement("button",{className:"btn btn-success",type:"submit"},"Create Recipe"),r&&n.createElement("span",{className:"fa fa-circle-o-notch fa-spin"})))))))))}}]),a}(n.Component),B=Object(o.b)((function(e){return{session:e.session}}))(z),V=a(30),H=a(31),W=a.n(H),q=a(39),J=function(e){Object(b.a)(a,e);var t=Object(g.a)(a);function a(e){var n;return Object(f.a)(this,a),(n=t.call(this,e)).processFormSubmission=function(){var e=Object(q.a)(W.a.mark((function e(t){return W.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:t.preventDefault(),n.setState({loading:!0}),S.a.put(O.a.host+O.a.port+"/api/recipe/".concat(n.state.id),n.state.values,n.state.headers).then((function(e){n.setState({submitSuccess:!0,loading:!1}),setTimeout((function(){n.props.history.push("/api/recipe")}),1500)})).catch((function(e){n.setState({submitSuccess:!1,submitFail:!0,errorMessage:e.response.data.message}),console.log(e)}));case 3:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}(),n.setValues=function(e){n.setState({values:Object(V.a)(Object(V.a)({},n.state.values),e)})},n.handleInputChanges=function(e){e.preventDefault(),n.setValues(Object(F.a)({},e.currentTarget.id,e.currentTarget.value))},n.state={id:n.props.match.params.id,recipe:{},values:[],loading:!1,submitSuccess:!1,submitFail:!1,errorMessage:null,headers:{}},n}return Object(E.a)(a,[{key:"componentDidMount",value:function(){var e=this;if(this.props.session.isLoggedIn){var t={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:t}),S.a.get(O.a.host+O.a.port+"/api/recipe/".concat(this.state.id),t).then((function(t){var a=t.data[0];e.setState({recipe:a})})).catch((function(e){return console.log(e)}))}}},{key:"render",value:function(){var e=this,t=this.state,a=t.submitSuccess,s=t.loading,r=t.submitFail,c=t.errorMessage;return n.createElement("div",{className:"main-container"},this.state.recipe&&n.createElement("div",{className:"row"},n.createElement("div",{className:"card mx-auto"},n.createElement("div",{className:"card-text"},n.createElement("div",{className:"row"},n.createElement("div",{className:"col-md-12 "},n.createElement("h2",null," Edit Recipe "),a&&n.createElement("div",{className:"alert alert-info",role:"alert"},"Recipe details have been edited successfully "),r&&n.createElement("div",{className:"alert alert-info",role:"alert"},c),n.createElement("form",{className:"row",id:"create-post-form",onSubmit:this.processFormSubmission,noValidate:!0},n.createElement("div",{className:"form-group col-md-12"},n.createElement("label",{htmlFor:"rating"}," What would you rate this Recipe on a scale of 1-10?",n.createElement("select",{defaultValue:this.state.recipe.rating,onChange:function(t){return e.handleInputChanges(t)},id:"rating",name:"rating",className:"form-control"},n.createElement("option",{value:"1"},"1"),n.createElement("option",{value:"2"},"2"),n.createElement("option",{value:"3"},"3"),n.createElement("option",{value:"4"},"4"),n.createElement("option",{value:"5"},"5"),n.createElement("option",{value:"6"},"6"),n.createElement("option",{value:"7"},"7"),n.createElement("option",{value:"8"},"8"),n.createElement("option",{value:"9"},"9"),n.createElement("option",{value:"10"},"10")))),n.createElement("div",{className:"form-group col-md-12"},n.createElement("label",{htmlFor:"is_public"}," Should this Recipe be Public to ALL logged-in Users?",n.createElement("select",{defaultValue:this.state.recipe.is_public,onChange:function(t){return e.handleInputChanges(t)},id:"is_public",name:"is_public",className:"form-control"},n.createElement("option",{value:"0"},"Private"),n.createElement("option",{value:"1"},"Public")))),n.createElement("div",{className:"form-group col-md-12"},n.createElement("label",{htmlFor:"first_name"}," Name/Title "),n.createElement("input",{type:"text",id:"name",defaultValue:this.state.recipe.name,onChange:function(t){return e.handleInputChanges(t)},name:"name",className:"form-control",placeholder:"Recipe Title"})),n.createElement("div",{className:"form-group col-md-12"},n.createElement("label",{htmlFor:"recipe"}," Recipe "),n.createElement("textarea",{id:"recipe",defaultValue:this.state.recipe.recipe,onChange:function(t){return e.handleInputChanges(t)},name:"recipe",className:"form-control",placeholder:"Enter the Recipe Here!!"})),n.createElement("div",{className:"form-group col-md-4 pull-right"},n.createElement("button",{className:"btn btn-success",type:"submit"},"Update Recipe"),s&&n.createElement("span",{className:"fa fa-circle-o-notch fa-spin"})))))))))}}]),a}(n.Component),X=Object(o.b)((function(e){return{session:e.session}}))(J),Z=function(e){Object(b.a)(a,e);var t=Object(g.a)(a);function a(e){var n;return Object(f.a)(this,a),(n=t.call(this,e)).processFormSubmission=function(){var e=Object(q.a)(W.a.mark((function e(t){return W.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:t.preventDefault(),n.setState({loading:!0}),S.a.put(O.a.host+O.a.port+"/api/user/".concat(n.state.id),n.state.values,n.state.headers).then((function(e){n.setState({submitSuccess:!0,loading:!1}),setTimeout((function(){n.props.history.push("/user")}),1500)})).catch((function(e){n.setState({submitSuccess:!1,submitFail:!0,errorMessage:e.response.data.message}),console.log(e)}));case 3:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}(),n.setValues=function(e){n.setState({values:Object(V.a)(Object(V.a)({},n.state.values),e)})},n.handleInputChanges=function(e){e.preventDefault(),n.setValues(Object(F.a)({},e.currentTarget.id,e.currentTarget.value))},n.state={id:n.props.match.params.id,user:{},values:[],loading:!1,submitSuccess:!1,submitFail:!1,errorMessage:null,headers:{}},n}return Object(E.a)(a,[{key:"componentDidMount",value:function(){var e=this;if(this.props.session.isLoggedIn){var t={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:t}),S.a.get(O.a.host+O.a.port+"/api/user/".concat(this.state.id),t).then((function(t){e.setState({user:t.data})})).catch((function(e){return console.log(e)}))}}},{key:"render",value:function(){var e=this,t=this.state,a=t.submitSuccess,s=t.loading,r=t.submitFail,c=t.errorMessage;return n.createElement("div",{className:"main-container"},this.state.user&&n.createElement("div",{className:"row"},n.createElement("div",{className:"card mx-auto"},n.createElement("div",{className:"card-text"},n.createElement("div",{className:"row"},n.createElement("div",{className:"col-md-12 "},n.createElement("h2",null," Edit user "),a&&n.createElement("div",{className:"alert alert-info",role:"alert"},"user's details has been edited successfully "),r&&n.createElement("div",{className:"alert alert-info",role:"alert"},c),n.createElement("form",{className:"row",id:"create-post-form",onSubmit:this.processFormSubmission,noValidate:!0},n.createElement("div",{className:"form-group col-md-12"},n.createElement("label",{htmlFor:"Username"}," User Name "),n.createElement("input",{type:"text",id:"Username",defaultValue:this.state.user.Username,onChange:function(t){return e.handleInputChanges(t)},name:"Username",className:"form-control",placeholder:"Enter user's first name"})),n.createElement("div",{className:"form-group col-md-12"},n.createElement("label",{htmlFor:"name"}," Name "),n.createElement("input",{type:"text",id:"name",defaultValue:this.state.user.name,onChange:function(t){return e.handleInputChanges(t)},name:"name",className:"form-control",placeholder:"Enter user's first name"})),n.createElement("div",{className:"form-group col-md-12"},n.createElement("label",{htmlFor:"email"}," Email "),n.createElement("input",{type:"email",id:"email",defaultValue:this.state.user.email,onChange:function(t){return e.handleInputChanges(t)},name:"email",className:"form-control",placeholder:"Enter user's email address"})),n.createElement("div",{className:"form-group col-md-12"},n.createElement("label",{htmlFor:"phone"}," Phone "),n.createElement("input",{type:"text",id:"phone_number",defaultValue:this.state.user.phone,onChange:function(t){return e.handleInputChanges(t)},name:"phone_number",className:"form-control",placeholder:"Enter user's phone number"})),n.createElement("div",{className:"form-group col-md-4 pull-right"},n.createElement("button",{className:"btn btn-success",type:"submit"},"Edit user "),s&&n.createElement("span",{className:"fa fa-circle-o-notch fa-spin"})))))))))}}]),a}(n.Component),$=Object(o.b)((function(e){return{session:e.session}}))(Z),G=(a(70),a(98)),K=a(101),Q=a(99);a(67).config();var Y={apiUrl:"https://zen-camino.com",region:"us-east-1",userPool:"us-east-1_7dmZzXWTs",clientId:"69mrmc3pptcr4sli93igf45gai",userPoolBaseUri:"https://umanage.auth.us-east-1.amazoncognito.com",callbackUri:"https://zen-camino.com/login",signoutUri:"https://zen-camino.com/logout",tokenScopes:["openid","email","profile"],apiUri:"https://zen-camino.com"},ee=a(17),te=a.n(ee);Q.config.region=Y.region;var ae=function(){var e=Y.userPoolBaseUri.replace("https://","").replace("http://","");return new G.CognitoAuth({UserPoolId:Y.userPool,ClientId:Y.clientId,AppWebDomain:e,TokenScopesArray:Y.tokenScopes,RedirectUriSignIn:Y.callbackUri,RedirectUriSignOut:Y.signoutUri})},ne=function(){return se().getCurrentUser()},se=function(){return new K.a({UserPoolId:Y.userPool,ClientId:Y.clientId})},re=function(){return new Promise((function(e,t){ne().getSession((function(a,n){if(!a&&n){var s={credentials:{accessToken:n.accessToken.jwtToken,idToken:n.idToken.jwtToken,refreshToken:n.refreshToken.token},user:{userName:n.idToken.payload["cognito:username"],email:n.idToken.payload.email},groups:n.idToken.payload["cognito:groups"],isAdmin:-1!==n.idToken.payload["cognito:groups"].indexOf("Admin"),expiration:n.accessToken.payload.exp};e(s)}else t(new Error("Failure getting Cognito session: "+a))}))}))},ce=function(){return"".concat(Y.userPoolBaseUri,"/login?response_type=code&client_id=").concat(Y.clientId,"&redirect_uri=").concat(Y.callbackUri)},oe=function(e){return console.log("href",e),new Promise((function(t,a){var n=ae();n.userhandler={onSuccess:function(e){t(e)},onFailure:function(e){console.log("auth",n),a(new Error("Failure parsing Cognito web response: "+e))}},n.parseCognitoWebResponse(e)}))},ie=function(){te.a.get("x-token")&&te.a.remove("x-token"),ae().signOut()};var le=function(e){Object(b.a)(a,e);var t=Object(g.a)(a);function a(e){var n;return Object(f.a)(this,a),(n=t.call(this,e)).onSignOut=function(e){e.preventDefault(),ie()},n.state={apiStatus:"Not called"},n}return Object(E.a)(a,[{key:"componentDidMount",value:function(){this.props.session.isLoggedIn}},{key:"render",value:function(){return s.a.createElement("div",{className:"Home"},s.a.createElement("header",{className:"Home-header rgba-black-strong"},s.a.createElement("div",{className:"intro container-fluid"},"Welcome to Bake n' Flake!"),s.a.createElement("img",{className:"Home-logo ",alt:"logo",src:"https://umanage-mowatr.s3.amazonaws.com/bake_n_flake_logo_250_250.png"})))}}]),a}(n.Component),me=Object(o.b)((function(e){return{session:e.session}}),(function(e){return{}}))(le),ue=a(40),pe=a(41),de=a(43),he=a(44),fe=function(e){Object(he.a)(a,e);var t=Object(de.a)(a);function a(){return Object(ue.a)(this,a),t.apply(this,arguments)}return Object(pe.a)(a,[{key:"componentDidMount",value:function(){}},{key:"render",value:function(){return s.a.createElement("div",{className:"Home"},s.a.createElement("header",{className:"Home-header"},s.a.createElement("p",null,"404 Page Not Found")))}}]),a}(n.Component),Ee=Object(o.b)()(fe);function be(){return function(e){var t=function(){if(te.a.get("x-token")){var e=JSON.parse(te.a.get("x-token")),t=Date.now()/1e3;if(e.expiration>t)return e}return!1}();t&&(re(),e({type:"SET_SESSION",session:t}))}}var ge=function(e){Object(he.a)(a,e);var t=Object(de.a)(a);function a(){return Object(ue.a)(this,a),t.apply(this,arguments)}return Object(pe.a)(a,[{key:"componentDidMount",value:function(){(this.props.location.hash||this.props.location.search)&&this.props.initSessionFromCallbackURI(window.location.href)}},{key:"render",value:function(){return!this.props.location.hash&&!this.props.location.search||this.props.session.isLoggedIn?s.a.createElement(N.a,{to:"/"}):s.a.createElement("div",null)}}]),a}(n.Component),ve=Object(o.b)((function(e){return{session:e.session}}),(function(e){return{initSessionFromCallbackURI:function(t){return e((a=t,function(e){return oe(a).then((function(){return re()})).then((function(t){te.a.set("x-token",t),e({type:"SET_SESSION",session:t})}))}));var a}}}))(ge),Ne=a(100),ye=function(e){var t=e.component,a=(e.roles,e.session),n=Object(Ne.a)(e,["component","roles","session"]);return s.a.createElement(N.b,Object.assign({},n,{render:function(e){return a.isLoggedIn?-1===a.groups.indexOf("Admin")?s.a.createElement(N.a,{to:{pathname:"/"}}):s.a.createElement(t,e):s.a.createElement(N.a,{to:{pathname:"/",state:{from:e.location}}})}}))};a(525);var Se=function(e){Object(b.a)(a,e);var t=Object(g.a)(a);function a(){var e;Object(f.a)(this,a);for(var n=arguments.length,s=new Array(n),r=0;r<n;r++)s[r]=arguments[r];return(e=t.call.apply(t,[this].concat(s))).onSignOut=function(e){e.preventDefault(),ie()},e}return Object(E.a)(a,[{key:"componentDidMount",value:function(){this.props.initSession(),console.log("app.props",this.props)}},{key:"render",value:function(){return n.createElement("div",null,n.createElement("nav",{className:"navbar navbar-expand-lg navbar-dark fixed-top scrolling-navbar"},n.createElement("div",{className:"container-fluid"},n.createElement("a",{className:"navbar-brand",href:"/"},n.createElement("img",{src:"https://umanage-mowatr.s3.amazonaws.com/bake_n_flake_logo_75_75.png",alt:"bake n flake bakery"})),n.createElement("button",{className:"navbar-toggler",type:"button","data-toggle":"collapse","data-target":"#basicExampleNav","aria-controls":"basicExampleNav","aria-expanded":"false","aria-label":"Toggle navigation"},n.createElement("span",{className:"navbar-toggler-icon"})),n.createElement("div",{className:"collapse navbar-collapse",id:"basicExampleNav"},n.createElement("ul",{className:"navbar-nav mr-auto"},this.props.session.isLoggedIn&&n.createElement("li",{className:"nav-item"},n.createElement(v.b,{className:"nav-link",to:"/user"},"Users")),this.props.session.isLoggedIn&&-1!==this.props.session.groups.indexOf("Admin")&&n.createElement("li",{className:"nav-item"},n.createElement(v.b,{className:"nav-link",to:"/recipe"},"Recipes"))),n.createElement("div",{id:"nav_user",className:"inline nav-link"},this.props.session.isLoggedIn?n.createElement("span",null,"Hello ",this.props.session.user.userName," "):n.createElement("a",{className:"Home-link",href:ce()},"Sign in")),this.props.session.isLoggedIn&&n.createElement("div",{className:"inline nav-link"},n.createElement("a",{className:"Home-link",href:"#",onClick:this.onSignOut},"Sign out"))))),n.createElement(N.d,null,n.createElement(N.b,{path:"/",exact:!0,component:me}),n.createElement(N.b,{path:"/logout",exact:!0,component:me}),n.createElement(N.b,{path:"/login",exact:!0,component:ve}),n.createElement(ye,{path:"/user",exact:!0,component:C,session:this.props.session}),n.createElement(ye,{path:"/user/create",exact:!0,component:R,session:this.props.session}),n.createElement(ye,{path:"/user/edit/:id",exact:!0,component:$,session:this.props.session}),n.createElement(ye,{path:"/recipe",exact:!0,component:x,session:this.props.session}),n.createElement(ye,{path:"/recipe/edit/:id",exact:!0,component:X,session:this.props.session}),n.createElement(ye,{path:"/recipe/create",exact:!0,component:B,session:this.props.session}),n.createElement(ye,{path:"/recipe/:id",exact:!0,component:_,session:this.props.session}),n.createElement(N.b,{component:Ee})))}}]),a}(n.Component),ke=Object(o.b)((function(e){return{session:e.session}}),(function(e){return{initSession:function(){return e(be())}}}))(Se);Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));c.a.render(s.a.createElement(o.a,{store:h},s.a.createElement(v.a,null,s.a.createElement(ke,null))),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))},68:function(e,t,a){},70:function(e,t,a){}},[[102,1,2]]]);
//# sourceMappingURL=main.b53b14f2.chunk.js.map