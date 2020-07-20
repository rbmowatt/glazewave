class StateRequest extends \Community\StateRequest
    {
        public function __construct( AvailableStateRepositoryInterface $avaliableStates){
            $this->_availableStates = $availableStates;
        }

        public function createFromGET(): StateRequestInterface 
        {
            if(!$this->_availableStates->getByName($_GET['state'])){
                throw new \Exception($_GET['state'] . ' is not a valid state ');
            }

            $request = new StateRequest();

            $request->addressId = (string) ($_GET['address_id'] ?? '');
            $request->state     = (string) ($_GET['state'] ?? '');
            return $request;
        }

    }

    IOC::getInstace()->set(StateRequestFactoryInterface::class, StateRequest::class);

    