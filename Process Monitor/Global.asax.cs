using System;
using Process_Monitor;
using System.Data.Entity;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using Process_Monitor.Models;  // Replace with your actual namespace
using Ninject;
using Ninject.Web.Common;
using Unity;
using Unity.Mvc5;

namespace Process_Monitor
{
    public class MvcApplication : HttpApplication
    {
        public static IKernel Kernel { get; private set; }

        protected void Application_Start()
        {
            var container = new UnityContainer();
            container.RegisterType<DbContext, ApplicationDbContext>();
            DependencyResolver.SetResolver(new UnityDependencyResolver(container));


            // Register Routes
            AreaRegistration.RegisterAllAreas();
            RouteConfig.RegisterRoutes(RouteTable.Routes);

            //// Initialize Dependency Injection
            //Kernel = new StandardKernel();
            //RegisterServices(Kernel);

            //// Configure database context
            //Database.SetInitializer<ApplicationDbContext>(null); // Prevent Entity Framework from using the default initializer
        }

        //private void RegisterServices(IKernel kernel)
        //{
        //    // Register ApplicationDbContext and other services
        //    kernel.Bind<ApplicationDbContext>().ToSelf().InRequestScope();
        //    kernel.Bind<DatabaseMethods>().ToSelf().InRequestScope();

        //    // Optionally, add additional DI bindings for your services
        //}

        // Handle DI Resolution in Controllers
        protected void Application_EndRequest()
        {
            // Dispose DI container at the end of the request
            //Kernel.Dispose();
        }
    }
}
