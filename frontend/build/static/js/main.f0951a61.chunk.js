(this.webpackJsonpfrontend=this.webpackJsonpfrontend||[]).push([[0],{104:function(e,t,a){e.exports=a(528)},115:function(e,t,a){},116:function(e,t,a){},5:function(e,t,a){a(44).config(),e.exports={host:"https://zen-camino.com",port:""}},50:function(e,t){},527:function(e,t,a){},528:function(e,t,a){"use strict";a.r(t);var n=a(0),s=a.n(n),r=a(35),i=a.n(r),o=a(9),c=a(27),l=a(20),u=a.n(l);var m=function(){if(u.a.get("x-token")){var e=JSON.parse(u.a.get("x-token")),t=Date.now()/1e3;if(e.expiration>t)return e}return!1}(),p=m||{isLoggedIn:!1,isAdmin:!1},d=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:p,t=arguments.length>1?arguments[1]:void 0;switch(t.type){case"SET_SESSION":return Object.assign({},t.session,{isLoggedIn:!0});case"CLEAR_SESSION":return p;default:return e}},h=Object(c.c)({session:d}),f=a(94);a(44).config();var b=c.d,v=Object(c.e)(h,b(Object(c.a)(f.a))),g=(a(115),a(7)),E=a(8),N=a(11),y=a(10),k=a(28),O=(a(116),a(23)),j=a(42),S=a(14),I=a.n(S),C=a(5),w=a.n(C),T=function(e){return s.a.createElement("header",{className:"background rgba-black-strong"},s.a.createElement("div",{className:"main-container"},e.children))},x=a(15),U=a(13),F=function(e){return s.a.createElement("div",{className:"row"},s.a.createElement("div",{className:"card mx-auto"},s.a.createElement("div",{href:"#"},s.a.createElement(x.a,{className:"float-right card-close",icon:U.e,size:"2x",onClick:e.returnToIndex})),s.a.createElement("div",{className:"card-text"},e.children)))},R=function(e){return s.a.createElement("form",{className:"row",id:"create-post-form",onSubmit:e.processFormSubmission,noValidate:!0},s.a.createElement("div",{className:"form-group col-md-12"},s.a.createElement("label",{htmlFor:"Username"}," User Name "),s.a.createElement("input",{disabled:!!e.edit&&"disabled",type:"text",id:"Username",defaultValue:e.edit&&e.user.Username||"",onChange:function(t){return e.handleInputChanges(t)},name:"Username",className:"form-control",placeholder:"Enter a Username for the user"})),s.a.createElement("div",{className:"form-group col-md-12"},s.a.createElement("label",{htmlFor:"name"}," Name "),s.a.createElement("input",{type:"text",id:"name",defaultValue:e.edit&&e.user.name||"",onChange:function(t){return e.handleInputChanges(t)},name:"name",className:"form-control",placeholder:"Enter user's first name"})),s.a.createElement("div",{className:"form-group col-md-12"},s.a.createElement("label",{htmlFor:"email"}," Email "),s.a.createElement("input",{type:"email",id:"email",defaultValue:e.edit&&e.user.email||"",onChange:function(t){return e.handleInputChanges(t)},name:"email",className:"form-control",placeholder:"Enter user's email address"})),s.a.createElement("div",{className:"form-group col-md-12"},s.a.createElement("label",{htmlFor:"phone"}," Phone "),s.a.createElement("input",{type:"text",id:"phone_number",defaultValue:e.edit&&e.user.phone_number||"",onKeyDown:function(e){return function(e){e.persist();if(-1!==[8,37,39].indexOf(e.keyCode)||!(e.currentTarget.value.length>11)&&Number.isInteger(parseInt(e.key))){var t=e.currentTarget.value,a=e.currentTarget,n=e.key;setTimeout((function(){""!==a.value&&0!==t.indexOf("+1")&&(a.value="+1"+n)}),1)}else e.preventDefault()}(e)},onChange:function(t){return e.handleInputChanges(t)},name:"phone_number",className:"form-control",placeholder:"+[d]1234567890"})),s.a.createElement("div",{className:"form-group col-md-4 pull-right"},s.a.createElement("button",{className:"btn btn-success",type:"submit"},e.edit?"Edit User":"Add User"),e.loading&&s.a.createElement("span",{className:"fa fa-circle-o-notch fa-spin"})))},A=function(e){Object(N.a)(a,e);var t=Object(y.a)(a);function a(e){var n;return Object(g.a)(this,a),(n=t.call(this,e)).processFormSubmission=function(e){e.preventDefault(),n.setState({loading:!0});var t={Username:n.state.Username,name:n.state.name,email:n.state.email,phone_number:n.state.phone_number};n.setState({submitSuccess:!0,values:[].concat(Object(j.a)(n.state.values),[t]),loading:!1}),n.props.session.isLoggedIn&&I.a.post(w.a.host+w.a.port+"/api/user",t,n.state.headers).then((function(e){return[setTimeout((function(){n.props.history.push("/user")}),1500)]})).catch((function(e){n.setState({submitSuccess:!1,submitFail:!0,errorMessage:e.response.data.message})}))},n.handleInputChanges=function(e){e.preventDefault(),n.setState(Object(O.a)({},e.currentTarget.name,e.currentTarget.value))},n.returnToIndex=function(e){n.props.history.push("/user")},n.state={Username:"",name:"",email:"",phone_number:"",values:[],loading:!1,submitSuccess:!1,submitFail:!1,errorMessage:null,headers:{}},n}return Object(E.a)(a,[{key:"componentDidMount",value:function(){if(this.props.session.isLoggedIn){var e={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:e})}}},{key:"render",value:function(){var e=this.state,t=e.submitSuccess,a=e.submitFail,s=e.loading,r=e.errorMessage;return n.createElement(T,null,n.createElement(F,{returnToIndex:this.returnToIndex},n.createElement("div",{className:"col-md-12 "},n.createElement("h2",null,"Create User"),!t&&n.createElement("div",{className:"alert alert-info",role:"alert"},"Fill the form below to create a new post"),t&&n.createElement("div",{className:"alert alert-info",role:"alert"},"The form was successfully submitted!"),a&&n.createElement("div",{className:"alert alert-info",role:"alert"},r),n.createElement(R,{user:this.state.user,handleInputChanges:this.handleInputChanges,loading:s,processFormSubmission:this.processFormSubmission}))))}}]),a}(n.Component),_=Object(o.b)((function(e){return{session:e.session}}))(A),L=function(){return s.a.createElement("div",{className:"spinner fadein"},s.a.createElement(x.a,{icon:U.a,size:"5x",color:"#3B5998"}))},D=function(e){return e.images.map((function(t,a){return s.a.createElement("div",{key:a,className:"fadein"},s.a.createElement("div",{onClick:function(){return e.removeImage(t.public_id)},className:"delete"},s.a.createElement(x.a,{icon:U.e})),s.a.createElement("img",{className:"preview",src:window.URL.createObjectURL(t),alt:""}))}))},P=function(e){return s.a.createElement("div",{className:""},s.a.createElement("label",{className:"fileContainer"},"Upload An Image!",s.a.createElement("input",{type:"file",id:"single",onChange:e.onChange,accept:".jpg,.jpeg,.gif,.png"})),s.a.createElement(x.a,{icon:U.c,color:"#3B5998",size:"3x"}))},z=function(e){return s.a.createElement("form",{className:"row",id:"create-post-form",onSubmit:e.processFormSubmission,noValidate:!0},s.a.createElement("div",{className:"form-group col-md-12"},s.a.createElement("label",{htmlFor:"rating"}," What would you rate this Recipe on a scale of 1-10?",s.a.createElement("select",{value:e.recipe.rating,onChange:function(t){return e.handleInputChanges(t)},id:"rating",name:"rating",className:"form-control"},s.a.createElement("option",{value:"1"},"1"),s.a.createElement("option",{value:"2"},"2"),s.a.createElement("option",{value:"3"},"3"),s.a.createElement("option",{value:"4"},"4"),s.a.createElement("option",{value:"5"},"5"),s.a.createElement("option",{value:"6"},"6"),s.a.createElement("option",{value:"7"},"7"),s.a.createElement("option",{value:"8"},"8"),s.a.createElement("option",{value:"9"},"9"),s.a.createElement("option",{value:"10"},"10")))),s.a.createElement("div",{className:"form-group col-md-12"},s.a.createElement("label",{htmlFor:"isPublic"}," Should this Recipe be Public to ALL logged-in Users?",s.a.createElement("select",{value:e.recipe.isPublic,onChange:function(t){return e.handleInputChanges(t)},id:"isPublic",name:"isPublic",className:"form-control"},s.a.createElement("option",{value:"0"},"Private"),s.a.createElement("option",{value:"1"},"Public")))),s.a.createElement("div",{className:"form-group col-md-12"},s.a.createElement("label",{htmlFor:"first_name"}," Name/Title "),s.a.createElement("input",{type:"text",id:"name",defaultValue:e.recipe.name,onChange:function(t){return e.handleInputChanges(t)},name:"name",className:"form-control",placeholder:"Recipe Title"})),s.a.createElement("div",{className:"form-group col-md-12"},s.a.createElement("label",{htmlFor:"recipe"}," Recipe "),s.a.createElement("textarea",{id:"recipe",defaultValue:e.recipe.recipe,onChange:function(t){return e.handleInputChanges(t)},name:"recipe",className:"form-control",placeholder:"Enter the Recipe Here!!"})),e.children&&s.a.createElement("div",{className:"form-group col-md-12"},e.children),s.a.createElement("div",{className:"form-group col-md-4 pull-right"},s.a.createElement("button",{className:"btn btn-success",type:"submit"},e.edit?"Edit Recipe":"Add Recipe")))},M=function(e){Object(N.a)(a,e);var t=Object(y.a)(a);function a(e){var n;return Object(g.a)(this,a),(n=t.call(this,e)).processFormSubmission=function(e){e.preventDefault(),n.setState({loading:!0});var t=new FormData;t.append("is_public",n.state.is_public),t.append("rating",n.state.rating),t.append("name",n.state.name),t.append("recipe",n.state.recipe),t.append("submitted_by",n.props.session.user.userName),n.state.images.forEach((function(e,a){t.append("photo",e)})),n.setState({submitSuccess:!0,values:[].concat(Object(j.a)(n.state.values),[t]),loading:!1}),n.props.session.isLoggedIn&&n.props.session.isAdmin&&I.a.post(w.a.host+w.a.port+"/api/recipe",t,n.state.headers).then((function(e){return[setTimeout((function(){n.props.history.push("/recipe")}),1500)]})).catch((function(e){n.setState({submitSuccess:!1,submitFail:!0,errorMessage:e.response.data.message})}))},n.handleInputChanges=function(e){e.preventDefault(),n.setState(Object(O.a)({},e.currentTarget.name,e.currentTarget.value))},n.onChange=function(e){var t=Array.from(e.target.files);n.setState({uploading:!1,images:t})},n.removeImage=function(e){n.setState({images:n.state.images.filter((function(t){return t.public_id!==e}))})},n.returnToIndex=function(e){n.props.history.push("/recipe")},n.state={rating:5,is_public:0,name:"",submitted_by:"",recipe:"",values:[],loading:!1,submitSuccess:!1,submitFail:!1,errorMessage:null,images:[],headers:{}},n}return Object(E.a)(a,[{key:"componentDidMount",value:function(){if(this.props.session.isLoggedIn){var e={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken),"content-type":"multipart/form-data"}};this.setState({headers:e})}else this.props.history.push("/")}},{key:"render",value:function(){var e=this,t=this.state,a=t.submitSuccess,s=t.submitFail,r=t.loading,i=t.errorMessage,o=t.uploading,c=t.images;return n.createElement(T,null,n.createElement(F,{returnToIndex:this.returnToIndex},n.createElement("div",{className:"col-md-12 "},n.createElement("h2",null,"Create Recipe"),!a&&n.createElement("div",{className:"alert alert-info",role:"alert"},"Fill the form below to create a new post"),a&&n.createElement("div",{className:"alert alert-info",role:"alert"},"The form was successfully submitted!"),s&&n.createElement("div",{className:"alert alert-info",role:"alert"},i),n.createElement(z,{recipe:this.state.recipe,handleInputChanges:this.handleInputChanges,processFormSubmission:this.processFormSubmission,loading:r},function(){switch(!0){case o:return n.createElement(L,null);case c.length>0:return n.createElement(D,{images:c,removeImage:e.removeImage});default:return n.createElement(P,{onChange:e.onChange})}}()))))}}]),a}(n.Component),B=Object(o.b)((function(e){return{session:e.session}}))(M),V=a(31),H=a(32),W=a.n(H),J=a(40),Y=function(e){Object(N.a)(a,e);var t=Object(y.a)(a);function a(e){var n;return Object(g.a)(this,a),(n=t.call(this,e)).processFormSubmission=function(){var e=Object(J.a)(W.a.mark((function e(t){return W.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:t.preventDefault(),n.setState({loading:!0}),I.a.put(w.a.host+w.a.port+"/api/recipe/".concat(n.state.id),n.state.values,n.state.headers).then((function(e){n.setState({submitSuccess:!0,loading:!1}),setTimeout((function(){n.props.history.push("/recipe")}),1500)})).catch((function(e){n.setState({submitSuccess:!1,submitFail:!0,errorMessage:e.response.data.message})}));case 3:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}(),n.setValues=function(e){n.setState({values:Object(V.a)(Object(V.a)({},n.state.values),e)})},n.handleInputChanges=function(e){e.preventDefault(),n.setValues(Object(O.a)({},e.currentTarget.id,e.currentTarget.value));var t=n.state.recipe;t[e.currentTarget.id]=e.currentTarget.value,n.setState({recipe:t})},n.returnToIndex=function(e){n.props.history.push("/recipe")},n.state={id:n.props.match.params.id,recipe:{},values:[],loading:!1,submitSuccess:!1,submitFail:!1,errorMessage:null,headers:{}},n}return Object(E.a)(a,[{key:"componentDidMount",value:function(){var e=this;if(this.props.session.isLoggedIn){var t={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:t}),I.a.get(w.a.host+w.a.port+"/api/recipe/".concat(this.state.id),t).then((function(t){var a=t.data[0];e.setState({recipe:a})})).catch((function(t){return e.props.history.push("/recipe")}))}}},{key:"render",value:function(){var e=this.state,t=e.submitSuccess,a=e.loading,s=e.submitFail,r=e.errorMessage;return n.createElement(T,null,n.createElement(F,{returnToIndex:this.returnToIndex},n.createElement("div",{className:"col-md-12 "},n.createElement("h2",null,"Edit Recipe"),t&&n.createElement("div",{className:"alert alert-info",role:"alert"},"Recipe details have been edited successfully "),s&&n.createElement("div",{className:"alert alert-info",role:"alert"},r)),n.createElement(z,{recipe:this.state.recipe,loading:a,handleInputChanges:this.handleInputChanges,processFormSubmission:this.processFormSubmission,edit:"true"})),"}")}}]),a}(n.Component),K=Object(o.b)((function(e){return{session:e.session}}))(Y),X=function(e){Object(N.a)(a,e);var t=Object(y.a)(a);function a(e){var n;return Object(g.a)(this,a),(n=t.call(this,e)).processFormSubmission=function(){var e=Object(J.a)(W.a.mark((function e(t){return W.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:t.preventDefault(),n.setState({loading:!0}),I.a.put(w.a.host+w.a.port+"/api/user/".concat(n.state.id),n.state.values,n.state.headers).then((function(e){n.setState({submitSuccess:!0,loading:!1}),setTimeout((function(){n.props.history.push("/user")}),1500)})).catch((function(e){n.setState({submitSuccess:!1,submitFail:!0,errorMessage:e.response.data.message})}));case 3:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}(),n.setValues=function(e){n.setState({values:Object(V.a)(Object(V.a)({},n.state.values),e)})},n.handleInputChanges=function(e){e.preventDefault(),n.setValues(Object(O.a)({},e.currentTarget.id,e.currentTarget.value))},n.returnToIndex=function(e){n.props.history.push("/user")},n.state={id:n.props.match.params.id,user:{},values:[],loading:!1,submitSuccess:!1,submitFail:!1,errorMessage:null,headers:{}},n}return Object(E.a)(a,[{key:"componentDidMount",value:function(){var e=this;if(this.props.session.isLoggedIn){var t={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:t}),I.a.get(w.a.host+w.a.port+"/api/user/".concat(this.state.id),t).then((function(t){e.setState({user:t.data})})).catch((function(t){return e.props.history.push("/user")}))}}},{key:"render",value:function(){var e=this.state,t=e.submitSuccess,a=e.loading,s=e.submitFail,r=e.errorMessage;return n.createElement(T,null,this.state.user&&n.createElement(F,{returnToIndex:this.returnToIndex},n.createElement("div",{className:"col-md-12 "},n.createElement("h2",null,"Edit User"),t&&n.createElement("div",{className:"alert alert-info",role:"alert"},"user's details has been edited successfully"),s&&n.createElement("div",{className:"alert alert-info",role:"alert"},r),n.createElement(R,{user:this.state.user,handleInputChanges:this.handleInputChanges,loading:a,processFormSubmission:this.processFormSubmission,edit:"true"}))))}}]),a}(n.Component),Z=Object(o.b)((function(e){return{session:e.session}}))(X),$=(a(67),a(95)),q=a(100),G=a(96);a(44).config();var Q={apiUrl:"https://zen-camino.com",region:"us-east-1",userPool:"us-east-1_7dmZzXWTs",clientId:"69mrmc3pptcr4sli93igf45gai",userPoolBaseUri:"https://umanage.auth.us-east-1.amazoncognito.com",callbackUri:"https://zen-camino.com/login",signoutUri:"https://zen-camino.com/logout",tokenScopes:["openid","email","profile"],apiUri:"https://zen-camino.com"};function ee(e){return function(t){return se(e).then((function(){return re()})).then((function(e){!function(e){u.a.set("x-token",e)}(e),t({type:"SET_SESSION",session:e})}))}}G.config.region=Q.region;var te=function(){var e=Q.userPoolBaseUri.replace("https://","").replace("http://","");return new $.CognitoAuth({UserPoolId:Q.userPool,ClientId:Q.clientId,AppWebDomain:e,TokenScopesArray:Q.tokenScopes,RedirectUriSignIn:Q.callbackUri,RedirectUriSignOut:Q.signoutUri})},ae=function(){return ne().getCurrentUser()},ne=function(){return new q.a({UserPoolId:Q.userPool,ClientId:Q.clientId})},se=function(e){return new Promise((function(t,a){var n=te();n.userhandler={onSuccess:function(e){t(e)},onFailure:function(e){a(new Error("Failure parsing Cognito web response: "+e))}},n.parseCognitoWebResponse(e)}))},re=function(){return new Promise((function(e,t){ae().getSession((function(a,n){if(!a&&n){var s={credentials:{accessToken:n.accessToken.jwtToken,idToken:n.idToken.jwtToken,refreshToken:n.refreshToken.token},user:{userName:n.idToken.payload["cognito:username"],email:n.idToken.payload.email},groups:n.idToken.payload["cognito:groups"],isAdmin:n.idToken.payload["cognito:groups"]instanceof Array&&-1!==n.idToken.payload["cognito:groups"].indexOf("Admin"),expiration:n.accessToken.payload.exp,isLoggedIn:!0};e(s)}else t(new Error("Failure getting Cognito session: "+a))}))}))},ie=function(){return"".concat(Q.userPoolBaseUri,"/login?response_type=code&client_id=").concat(Q.clientId,"&redirect_uri=").concat(Q.callbackUri)},oe=function(){u.a.get("x-token")&&u.a.remove("x-token"),te().signOut()};var ce=function(e){Object(N.a)(a,e);var t=Object(y.a)(a);function a(e){var n;return Object(g.a)(this,a),(n=t.call(this,e)).onSignOut=function(e){e.preventDefault(),oe()},n.state={apiStatus:"Not called"},n}return Object(E.a)(a,[{key:"componentDidMount",value:function(){this.props.session.isLoggedIn}},{key:"render",value:function(){return s.a.createElement("div",{className:"Home"},s.a.createElement("header",{className:"background home-background"},s.a.createElement("div",{className:"intro container-fluid"},"Welcome to Bake n' Flake!"),s.a.createElement("img",{className:"Home-logo ",alt:"logo",src:"https://umanage-mowatr.s3.amazonaws.com/bake_n_flake_logo_250_250.png"})))}}]),a}(n.Component),le=Object(o.b)((function(e){return{session:e.session}}),(function(e){return{}}))(ce);var ue=function(e){Object(N.a)(a,e);var t=Object(y.a)(a);function a(){return Object(g.a)(this,a),t.apply(this,arguments)}return Object(E.a)(a,[{key:"componentDidMount",value:function(){(this.props.location.hash||this.props.location.search)&&this.props.initSessionFromCallbackURI(window.location.href)}},{key:"render",value:function(){return!this.props.location.hash&&!this.props.location.search||this.props.session.isLoggedIn?s.a.createElement(k.a,{to:"/"}):s.a.createElement("div",null)}}]),a}(n.Component),me=Object(o.b)((function(e){return{session:e.session}}),(function(e){return{initSessionFromCallbackURI:function(t){return e(ee(t))}}}))(ue),pe=a(21),de=function(e){e.preventDefault(),oe()},he=function(e){return s.a.createElement("nav",{className:"navbar navbar-expand-md navbar-dark"},s.a.createElement("button",{type:"button",className:"navbar-toggler","data-toggle":"collapse","data-target":"#navbarCollapse"},s.a.createElement("span",{className:"navbar-toggler-icon"})),s.a.createElement("div",{className:"collapse navbar-collapse",id:"navbarCollapse"},s.a.createElement("div",{className:"navbar-nav"},s.a.createElement("a",{className:"navbar-brand",href:"/"},s.a.createElement("img",{src:"https://umanage-mowatr.s3.amazonaws.com/bake_n_flake_logo.png",alt:"bake n flake bakery",height:"50",width:"50"})),e.session.isLoggedIn&&e.session.isAdmin&&s.a.createElement(pe.b,{className:"nav-link",to:"/user"},"Users"),e.session.isLoggedIn&&s.a.createElement(pe.b,{className:"nav-link",to:"/recipe"},"Recipes")),s.a.createElement("div",{className:"navbar-nav ml-auto"},e.session.isLoggedIn?s.a.createElement("span",null,s.a.createElement("span",{className:"white-txt"},"Hello ",e.session.user.userName,"\xa0\xa0"),s.a.createElement("span",null,s.a.createElement("a",{className:"Home-link",href:"#",onClick:de},"Sign out")," ")):s.a.createElement("a",{className:"Home-link",href:ie()},"Sign in"))))},fe=a(98),be=a(99),ve=a(101),ge=a(103),Ee=function(e){Object(ge.a)(a,e);var t=Object(ve.a)(a);function a(){return Object(fe.a)(this,a),t.apply(this,arguments)}return Object(be.a)(a,[{key:"componentDidMount",value:function(){}},{key:"render",value:function(){return s.a.createElement("div",{className:"Home"},s.a.createElement("header",{className:"Home-header"},s.a.createElement("p",null,"404 Page Not Found")))}}]),a}(n.Component),Ne=Object(o.b)()(Ee),ye=a(102),ke=function(e){var t=e.component,a=(e.roles,e.session),n=Object(ye.a)(e,["component","roles","session"]);return s.a.createElement(k.b,Object.assign({},n,{render:function(e){return a.isLoggedIn?a.isAdmin?s.a.createElement(t,e):s.a.createElement(k.a,{to:{pathname:"/"}}):s.a.createElement(k.a,{to:{pathname:"/",state:{from:e.location}}})}}))},Oe=a(25),je=function(e){for(var t=[],a=0;a<e.stars;a++)t.push(s.a.createElement(x.a,{className:"star",icon:U.d,size:"1x",key:a+1}));return t},Se=function(e){Object(N.a)(a,e);var t=Object(y.a)(a);function a(){return Object(g.a)(this,a),t.apply(this,arguments)}return Object(E.a)(a,[{key:"render",value:function(){var e=this;return s.a.createElement("div",{className:"row table-row",key:this.props.recipe.id},s.a.createElement("div",{className:"col-6"},s.a.createElement("a",{href:"#",onClick:function(){return e.props.viewRecipe(e.props.recipe.id)}},this.props.recipe.name)),s.a.createElement("div",{className:"col-3"},this.props.recipe.submitted_by),s.a.createElement("div",{className:"col-3 recipe-details"},s.a.createElement("div",null,this.props.recipe.isPublic&&"0"!==this.props.recipe.isPublic?"Public":"Private"),s.a.createElement("div",null,s.a.createElement(je,{stars:this.props.recipe.rating})),s.a.createElement("div",{className:"edit-delete"},this.props.isAdmin&&s.a.createElement(x.a,{size:"lg",alt:"edit user",style:{marginLeft:".1em",cursor:"pointer"},icon:U.b,onClick:function(){return e.props.editRecipe(e.props.recipe.id)}}),this.props.isAdmin&&s.a.createElement(x.a,{size:"lg",alt:"delete user",style:{marginLeft:".5em",cursor:"pointer",color:"red"},icon:U.f,onClick:function(){return e.props.deleteRecipe(e.props.recipe.id)}}))))}}]),a}(s.a.Component),Ie=a(41),Ce=(a(92),function(e){Object(N.a)(a,e);var t=Object(y.a)(a);function a(e){var n;return Object(g.a)(this,a),(n=t.call(this,e)).state={recipes:[],headers:{},isAdmin:!1},n.deleteRecipe=n.deleteRecipe.bind(Object(Oe.a)(n)),n.editRecipe=n.editRecipe.bind(Object(Oe.a)(n)),n.viewRecipe=n.viewRecipe.bind(Object(Oe.a)(n)),n}return Object(E.a)(a,[{key:"componentDidMount",value:function(){var e=this;if(this.props.session.isLoggedIn){this.setState({isAdmin:this.props.session.isAdmin});var t={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:t}),I.a.get(w.a.host+w.a.port+"/api/recipe",t).then((function(t){t.data.sort((function(e,t){return e.name>t.name?1:t.name>e.name?-1:0})),e.setState({recipes:t.data})}))}}},{key:"deleteRecipe",value:function(e){var t=this;Object(Ie.confirmAlert)({title:"Confirm To Delete",message:"Are you sure you want to delete this recipe?",buttons:[{label:"Yes",onClick:function(){I.a.delete(w.a.host+w.a.port+"/api/recipe/".concat(e),t.state.headers).then((function(a){var n=t.state.recipes.findIndex((function(t){return t.id===e}));t.state.recipes.splice(n,1),t.props.history.push("/recipe")}))}},{label:"No",onClick:function(){}}]})}},{key:"editRecipe",value:function(e){this.props.history.push("/recipe/edit/"+e)}},{key:"viewRecipe",value:function(e){this.props.history.push("/recipe/"+e)}},{key:"render",value:function(){var e=this,t=this.state.recipes;return s.a.createElement(T,null,s.a.createElement("div",{className:"row"},s.a.createElement("div",{className:"card mx-auto"},s.a.createElement("div",{className:"card-title"},s.a.createElement("h2",null,"Recipes",this.state.isAdmin&&s.a.createElement(pe.b,{to:"recipe/create",className:"btn btn-sm btn-outline-secondary float-right"}," Create New Recipe"))),s.a.createElement("div",{className:"card-text"},s.a.createElement("div",{className:"table-container"},s.a.createElement("div",{className:"row table-header"},s.a.createElement("div",{className:"col-6"},"Title"),s.a.createElement("div",{className:"col-3"},"Author"),s.a.createElement("div",{className:"col-3"},"Info")),t&&t.map((function(t){return(e.state.isAdmin||t.isPublic)&&s.a.createElement(Se,{recipe:t,deleteRecipe:e.deleteRecipe,viewRecipe:e.viewRecipe,editRecipe:e.editRecipe,isAdmin:e.state.isAdmin,key:t.id})})),(!t||0===t.length)&&s.a.createElement("div",{className:"col-12"},s.a.createElement("h3",null,"No recipes found at the moment")))))))}}]),a}(n.Component)),we=Object(o.b)((function(e){return{session:e.session}}))(Ce),Te=(a(527),function(e){Object(N.a)(a,e);var t=Object(y.a)(a);function a(e){var n;return Object(g.a)(this,a),(n=t.call(this,e)).returnToIndex=function(e){n.props.history.push("/recipe")},n.state={recipe:[],headers:{}},n}return Object(E.a)(a,[{key:"componentDidMount",value:function(){var e=this;if(this.props.session.isLoggedIn){var t={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:t}),I.a.get(w.a.host+w.a.port+"/api/recipe/"+this.props.match.params.id,this.state.headers).then((function(t){!e.props.session.isAdmin&&!t.data[0].isPublic||0===t.data.length?e.props.history.push("/recipe"):e.setState({recipe:t.data[0]})})).catch((function(t){return e.props.history.push("/recipe")}))}this.state.recipe===[]&&this.props.history.push("/recipe")}},{key:"render",value:function(){var e=this.state.recipe,t=null==e.picture?"no_photo.jpg":e.picture;return s.a.createElement(T,null,s.a.createElement(F,{returnToIndex:this.returnToIndex},s.a.createElement("div",{className:"container"},s.a.createElement("div",{className:"wrapper row"},s.a.createElement("div",{className:"preview col-md-6"},s.a.createElement("div",{className:"preview-pic tab-content"},s.a.createElement("div",{className:"tab-pane active",id:"pic-1"},s.a.createElement("img",{src:"https://umanage-mowatr.s3.amazonaws.com/"+t,alt:"recipe"})))),s.a.createElement("div",{className:"details col-md-6"},s.a.createElement("h3",{className:"recipe-title"},e.name),s.a.createElement("h5",{className:"submitted-by"},"By ",s.a.createElement("span",null,e.submitted_by)),s.a.createElement("h5",{className:"review-no"},"Rated: ",e.rating,"/10 "),s.a.createElement("div",{className:"rating"},s.a.createElement(je,{stars:e.rating})),s.a.createElement("h5",{className:"review-no"},"Recipe:"),s.a.createElement("p",{className:"recipe-description"},e.recipe))))))}}]),a}(n.Component)),xe=Object(o.b)((function(e){return{session:e.session}}))(Te),Ue=function(e){Object(N.a)(a,e);var t=Object(y.a)(a);function a(){return Object(g.a)(this,a),t.apply(this,arguments)}return Object(E.a)(a,[{key:"render",value:function(){var e=this;return s.a.createElement("div",{className:"row table-row",key:this.props.user.Username},s.a.createElement("div",{className:"col-2"},this.props.user.Username),s.a.createElement("div",{className:"col-3"},this.props.user.name),s.a.createElement("div",{className:"col-3"},this.props.user.email),s.a.createElement("div",{className:"col-3"},this.props.user.phone_number),s.a.createElement("div",{className:"col-1 recipe-details"},s.a.createElement("div",null,s.a.createElement(x.a,{alt:"edit user",style:{marginLeft:".1em",cursor:"pointer"},icon:U.b,onClick:function(){return e.props.editUser(e.props.user.Username)}}),s.a.createElement(x.a,{alt:"delete user",style:{marginLeft:".5em",cursor:"pointer",color:"red"},icon:U.f,onClick:function(){return e.props.deleteUser(e.props.user.Username)}}))))}}]),a}(s.a.Component),Fe=function(e){Object(N.a)(a,e);var t=Object(y.a)(a);function a(e){var n;return Object(g.a)(this,a),(n=t.call(this,e)).state={users:[],headers:{}},n.deleteUser=n.deleteUser.bind(Object(Oe.a)(n)),n.editUser=n.editUser.bind(Object(Oe.a)(n)),n}return Object(E.a)(a,[{key:"componentDidMount",value:function(){var e=this;if(this.props.session.isLoggedIn){var t={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:t}),I.a.get(w.a.host+w.a.port+"/api/user",t).then((function(t){t.data.sort((function(e,t){return e.Username>t.Username?1:t.Username>e.Username?-1:0})),e.setState({users:t.data})}))}}},{key:"deleteUser",value:function(e){var t=this;Object(Ie.confirmAlert)({title:"Confirm To Delete",message:"Are you sure to do this.",buttons:[{label:"Yes",onClick:function(){I.a.delete(w.a.host+w.a.port+"/api/user/".concat(e),t.state.headers).then((function(a){var n=t.state.users.findIndex((function(t){return t.id===e}));t.state.users.splice(n,1),t.props.history.push("/user")}))}},{label:"No",onClick:function(){}}]})}},{key:"editUser",value:function(e){this.props.history.push("/user/edit/"+e)}},{key:"render",value:function(){var e=this,t=this.state.users;return s.a.createElement(T,null,s.a.createElement("div",{className:"row"},s.a.createElement("div",{className:"card mx-auto"},s.a.createElement("div",{className:"card-title"},s.a.createElement("h2",null," ",s.a.createElement("strong",null,"Users")," ",s.a.createElement(pe.b,{to:"user/create",className:"btn btn-sm btn-outline-secondary float-right"}," Create New User"))),s.a.createElement("div",{className:"card-text"},s.a.createElement("div",{className:"table-container"},s.a.createElement("div",{className:"row table-header"},s.a.createElement("div",{className:"col-2"},"Login"),s.a.createElement("div",{className:"col-3"},"Full Name"),s.a.createElement("div",{className:"col-3"},"Email"),s.a.createElement("div",{className:"col-3"},"Phone"),s.a.createElement("div",{className:"col-1"},"\xa0")),t&&t.map((function(t){return s.a.createElement(Ue,{user:t,deleteUser:e.deleteUser,editUser:e.editUser,key:t.Username})})),(!t||0===t.length)&&s.a.createElement("div",{className:"col-12"},s.a.createElement("h3",null,"No users found at the moment")))))))}}]),a}(n.Component),Re=Object(o.b)((function(e){return{session:e.session}}))(Fe),Ae=function(e){Object(N.a)(a,e);var t=Object(y.a)(a);function a(){return Object(g.a)(this,a),t.apply(this,arguments)}return Object(E.a)(a,[{key:"render",value:function(){return n.createElement("div",null,n.createElement(he,{session:this.props.session}),n.createElement(k.d,null,n.createElement(k.b,{path:"/",exact:!0,component:le}),n.createElement(k.b,{path:"/login",exact:!0,component:me}),n.createElement(k.b,{path:"/logout",exact:!0,component:le}),n.createElement(k.b,{path:"/recipe",exact:!0,component:we}),n.createElement(ke,{path:"/recipe/edit/:id",exact:!0,component:K,session:this.props.session}),n.createElement(ke,{path:"/recipe/create",exact:!0,component:B,session:this.props.session}),n.createElement(k.b,{path:"/recipe/:id",exact:!0,component:xe}),n.createElement(ke,{path:"/user",exact:!0,component:Re,session:this.props.session}),n.createElement(ke,{path:"/user/create",exact:!0,component:_,session:this.props.session}),n.createElement(ke,{path:"/user/edit/:id",exact:!0,component:Z,session:this.props.session}),n.createElement(k.b,{component:Ne})))}}]),a}(n.Component),_e=Object(o.b)((function(e){return{session:e.session}}))(Ae);Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));i.a.render(s.a.createElement(o.a,{store:v},s.a.createElement(pe.a,null,s.a.createElement(_e,null))),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))},67:function(e,t,a){}},[[104,1,2]]]);
//# sourceMappingURL=main.f0951a61.chunk.js.map